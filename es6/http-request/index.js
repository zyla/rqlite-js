/**
 * Plain HTTP client to be used when creating RQLite specific API HTTP clients
 * @module http-request
 */
import rp from 'request-promise'
import r from 'request'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
} from './http-methods'
import {
  CONTENT_TYPE_APPLICATION_JSON,
  // CONTENT_TYPE_APPLICATION_OCTET_STREAM,
} from './content-types'

/**
 * The default timeout value
 */
export const DEAULT_TIMEOUT = 30000

/**
 * The default to retry a request using the next host in the chain
 */
export const DEAULT_RETRY_DELAY = 30000

/**
 * Create default header for all HTTP requests
 * @param {Object} [headers={}] HTTP headers to send with the request
 * @returns {Object} The headers with defaults applied
 */
export function createDefaultHeaders (headers = {}) {
  const { Accept = CONTENT_TYPE_APPLICATION_JSON } = headers
  return { ...headers, Accept }
}

/**
 * Clean the request path remove / from the beginning
 * @param {String} path The path to clean
 * @returns {String} The clean path
 */
function cleanPath (path) {
  return String(path).replace(/^\//, '')
}

/**
 * Generic HTTP Request class which all RQLiteJS client
 * should extend for consistent communitication with an RQLite
 * server
 */
export default class HttpRequest {
  /**
   * The index of the host in this.hosts which will be tried
   * first before attempting other hosts
   * @type {Number}
   */
  activeHostIndex = 0

  /**
   * Whether or not the setNextActiveHostIndex() should
   * perform a round robin strategy
   */
  activeHostRoundRobin = true

  /**
   * The regex pattern to check if a uri is absolute or relative,
   * if it is absolute the host is not appended
   */
  absoluteUriPattern = /^https?:\/\//

  /**
   * A list of hosts that are tried in round robin fashion
   * when certain HTTP responses are received
   * @type {String[]}
   */
  hosts = []

  /**
   * Construtor for HttpRequest
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   * @param {Object} [options={}] Additional options
   * @param {Boolean} [options.activeHostRoundRobin=true] If true this.setNextActiveHostIndex()
   * will perform a round robin when called
   */
  constructor (hosts, options = {}) {
    this.setHosts(hosts)
    if (this.getTotalHosts() === 0) {
      throw new Error('At least one host must be provided')
    }
    const { activeHostRoundRobin = true } = options
    if (typeof activeHostRoundRobin !== 'undefined') {
      this.setActiveHostRoundRobin(activeHostRoundRobin)
    }
  }

  /**
   * Set the list of hosts
   * @param {String[]|String} hosts An array of RQLite hosts or a string
   * that will be split on "," to create an array of hosts, the first
   * host will be tried first when there are multiple hosts
   */
  setHosts (hosts) {
    this.hosts = !Array.isArray(hosts) ? String(hosts).split(',') : hosts
    // Remove trailing slashed from hosts
    this.hosts = this.hosts.map(host => host.replace(/\/$/, ''))
  }

  /**
   * Get the list of hosts
   * @returns {String[]} The list of hosts
   */
  getHosts () {
    return this.hosts
  }

  /**
   * Get the current active host from the hosts array
   * @param {Boolean} useLeader If true use the first host which is always
   * the master, this is prefered for write operations
   * @returns {String} The active host
   */
  getActiveHost (useLeader) {
    // When useLeader is true we should just use the first host
    const activeHostIndex = useLeader ? 0 : this.activeHostIndex
    return this.getHosts()[activeHostIndex]
  }

  /**
   * Set the active host index with check based on this.hosts
   * @param {Number} activeHostIndex The index
   */
  setActiveHostIndex (activeHostIndex) {
    if (!Number.isFinite(activeHostIndex)) {
      throw new Error('The activeHostIndex should be a finite number')
    }
    const totalHosts = this.getTotalHosts()
    if (activeHostIndex < 0) {
      // Don't allow an index less then zero
      this.activeHostIndex = 0
    } else if (activeHostIndex >= totalHosts) {
      // Don't allow an index greater then the length of the hosts
      this.activeHostIndex = totalHosts - 1
    } else {
      this.activeHostIndex = activeHostIndex
    }
  }

  /**
   * Get the active host index
   * @returns {Number} The active host index
   */
  getActiveHostIndex (useLeader) {
    return useLeader ? 0 : this.activeHostIndex
  }

  /**
   * Set active host round robin value
   * @param {Boolean} activeHostRoundRobin If true setActiveHostIndex() will
   * perform a round robin
   */
  setActiveHostRoundRobin (activeHostRoundRobin) {
    if (typeof activeHostRoundRobin !== 'boolean') {
      throw new Error('The activeHostRoundRobin argument must be boolean')
    }
    this.activeHostRoundRobin = activeHostRoundRobin
  }

  /**
   * Get active host round robin value
   * @returns {Boolean} The value of activeHostRoundRobin
   */
  getActiveHostRoundRobin () {
    return this.activeHostRoundRobin
  }

  /**
   * Set the active host index to the next host using a
   * round robin strategy
   */
  setNextActiveHostIndex () {
    // Don't bother if we only have one host
    if (this.activeHostRoundRobin && this.getHosts().length === 0) {
      return
    }
    let nextIndex = this.activeHostIndex + 1
    // If we are past the last index start back over at 1
    if (this.getTotalHosts() === nextIndex) {
      nextIndex = 0
    }
    this.setActiveHostIndex(nextIndex)
  }

  /**
   * Get the total number of hosts
   * @returns {Number} The total number of hosts
   */
  getTotalHosts () {
    return this.getHosts().length
  }

  /**
   * Returns whether or not the uri passes a test for this.absoluteUriPattern
   * @returns {Boolean} True if the path is absolute
   */
  uriIsAbsolute (uri) {
    return this.absoluteUriPattern.test(uri)
  }

  /**
   * Perform an HTTP request using the provided options
   * @param {Object} [options={}] Options for the HTTP client
   * @param {Object} [options.activeHostIndex] A manually provde active host index
   * or falls back to select logic honoring useLeader
   * @param {Object} [options.auth] A object for user authentication
   * i.e. { username: 'test', password: "password" }
   * @param {Object} [options.body] The body of the HTTP request
   * @param {Boolean} [options.forever=true] When true use the forever keepalive agent
   * @param {Boolean|Function} [options.gzip=true] If true add accept deflate headers and
   * uncompress the response body
   * @param {Object} [options.headers={}] HTTP headers to send with the request
   * @param {String} [options.httpMethod=HTTP_METHOD_GET] The HTTP method for the request
   * i.e. GET or POST
   * @param {Boolean} [options.json=true] When true automatically parse JSON in the response body
   * and stringify the request body
   * @param {Object} [options.query] An object with the query to send with the HTTP request
   * @param {Boolean} [options.stream=false] When true the returned value is a request object with
   * stream support instead of a request-promise result
   * @param {Object} [options.timeout=DEAULT_TIMEOUT] Optional timeout to override default
   * @param {String} options.uri The uri for the request which can be a relative path to use
   * the currently active host or a full i.e. http://localhost:4001/db/query which is used
   * literally
   * @param {String} options.useLeader When true the request will use the master host, the
   * first host in this.hosts, this is ideal for write operations to skip the redirect
   * @returns {Object} A request-promise result when stream is false and a request object
   * with stream support when stream is true
   */
  async fetch (options = {}) {
    const {
      auth,
      body,
      forever = true,
      gzip = true,
      headers = {},
      httpMethod = HTTP_METHOD_GET,
      json = true,
      query,
      stream = false,
      timeout = DEAULT_TIMEOUT,
      useLeader = false,
      numHostRetriesRemaining = this.hosts.length - 1
    } = options
    // Honor the supplied activeHostIndex or get the active host
    const { activeHostIndex = this.getActiveHostIndex(useLeader) } = options
    const activeHost = this.hosts[activeHostIndex]
    let { uri } = options
    if (!uri) {
      throw new Error('The uri option is required')
    }
    uri = this.uriIsAbsolute(uri) ? uri : `${activeHost}/${cleanPath(uri)}`
    // If a stream is request use the request library directly
    if (stream) {
      return r({
        auth,
        body,
        forever,
        gzip,
        followAllRedirects: true,
        followOriginalHttpMethod: true,
        followRedirect: true,
        headers: createDefaultHeaders(headers),
        json,
        method: httpMethod,
        qs: query,
        timeout,
        uri,
      })
    }
    const requestPromiseOptions = {
      auth,
      body,
      followAllRedirects: false,
      followOriginalHttpMethod: false,
      followRedirect: false,
      forever,
      gzip,
      headers: createDefaultHeaders(headers),
      json,
      method: httpMethod,
      qs: query,
      resolveWithFullResponse: true,
      simple: false,
      timeout,
      transform (responseBody, response, resolveWithFullResponse) {
        // Handle 301 and 302 redirects
        const { statusCode: responseStatusCode, headers: responseHeaders = {} } = response
        if (responseStatusCode === 301 || responseStatusCode === 302) {
          const { location: redirectUri } = responseHeaders
          this.uri = redirectUri
          this.qs = undefined
          return rp({ ...requestPromiseOptions, uri: redirectUri })
        }
        return resolveWithFullResponse ? response : responseBody
      },
      uri,
    }
    try {
      return await rp(requestPromiseOptions)
    } catch(e) {
      if(e.error && (e.error.errno == 'ECONNREFUSED' || e.error.errno == 'ENOTFOUND') && numHostRetriesRemaining > 0) {
        console.log(`Connection to ${activeHost} failed: ${e.error.errno}; trying next host`);
        return await this.fetch({
          ...options,
          useLeader: false,
          activeHostIndex: (activeHostIndex + 1) % this.hosts.length,
          numHostRetriesRemaining: numHostRetriesRemaining - 1,
        });
      }
      console.error(e);
      throw e;
    }
  }

  /**
   * Perform an HTTP GET request
   * @param {Object} [options={}] The options
   * @see this.fetch() for options
   */
  async get (options = {}) {
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_GET })
  }

  /**
   * Perform an HTTP POST request
   * @param {Object} [options={}] The options
   * @see this.fetch() for options
   */
  async post (options = {}) {
    return this.fetch({ ...options, httpMethod: HTTP_METHOD_POST })
  }
}
