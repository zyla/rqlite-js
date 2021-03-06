import { assert } from 'chai'
import { stringify as stringifyQuery } from 'qs'
import { querySuccess, queryRedirectSuccess, QUERY_SUCCESS_RESPONSE } from '../test/api-data-query-nock'
import { executeSuccess, executeRedirectSuccess, EXECUTE_SUCCESS_RESPONSE } from '../test/api-data-execute-nock'
import { CONTENT_TYPE_APPLICATION_JSON } from './content-types'
import HttpRequest, { createDefaultHeaders } from '.'

const username = 'TestUsername'
const password = 'TestPassword'
const auth = {
  user: username,
  pass: password,
}

/**
 * Capture the stream data and resolve a promise with the parsed JSON
 */
function handleRequestSteamAsPromise (request) {
  return new Promise(async (resolve, reject) => {
    let json = Buffer.from('')
    request
      .on('data', (data) => {
        json = Buffer.concat([json, data])
      })
      .on('end', () => resolve(JSON.parse(json)))
      .on('error', reject)
  })
}

describe('http-request', () => {
  describe('Function: createDefaultHeaders()', () => {
    it(`should add the Accept header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, () => {
      assert.deepEqual({ Accept: CONTENT_TYPE_APPLICATION_JSON }, createDefaultHeaders())
    })
  })
  describe('Function: get()', () => {
    it('should perform a HTTP GET request with a query', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, query })
      const res = await httpRequest.get({ uri: path, query })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP GET request with a query and follow redirects', async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scopeRedirect = queryRedirectSuccess({
        url,
        path,
        query,
        redirectLocation: `${urlRedirectDestination}${path}?${stringifyQuery(query)}`,
      })
      const scope = querySuccess({ url: urlRedirectDestination, path, query })
      const res = await httpRequest.get({ uri: path, query })
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP GET request with basic authentication', async () => {
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      const res = await httpRequest.get({ uri: path, query })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP GET request with a query when the stream option is true', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestSteamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
    it('should perform a HTTP GET request with a query when the stream option is true and follow redirects', async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scopeRedirect = queryRedirectSuccess({
        url,
        path,
        query,
        redirectLocation: `${urlRedirectDestination}${path}?${stringifyQuery(query)}`,
      })
      const scope = querySuccess({ url: urlRedirectDestination, path, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestSteamAsPromise(request)
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
    it('should perform a HTTP GET request with basic authentication when the stream option is true', async () => {
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      const request = await httpRequest.get({ uri: path, query, stream: true })
      const result = await handleRequestSteamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, QUERY_SUCCESS_RESPONSE)
    })
  })
  describe('Function: post()', () => {
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path })
      const res = await httpRequest.post({ uri: path, body })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body and follow redirects`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const urlRedirectDestination = 'http://www.rqlite.com:4002'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scopeRedirect = executeRedirectSuccess({
        url,
        path,
        redirectLocation: `${urlRedirectDestination}${path}`,
      })
      const scope = executeSuccess({ url: urlRedirectDestination, path })
      const res = await httpRequest.post({ uri: path, body })
      assert.isTrue(scopeRedirect.isDone(), 'http redirect request captured by nock')
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const res = await httpRequest.post({ uri: path, body, auth })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path })
      const request = await httpRequest.post({ uri: path, body, stream: true })
      const result = await handleRequestSteamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should send a HTTP POST request including ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })
      const request = await httpRequest.post({ auth, uri: path, body, stream: true })
      const result = await handleRequestSteamAsPromise(request)
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(result, EXECUTE_SUCCESS_RESPONSE)
    })
  })
})
