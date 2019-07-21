import { assert } from 'chai'
import {
  querySuccess,
  QUERY_SUCCESS_RESPONSE,
  queryMultipleSuccess,
  QUERY_MULTIPLE_SUCCESS_RESPONSE,
} from '../../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../../test/api-data-execute-nock'
import DataApiClient, { PATH_QUERY, PATH_EXECUTE } from '.'

const HOST = 'http://www.rqlite.com:4001'

describe('api data', () => {
  describe('DataApiclient.query()', () => {
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP GET and include a level query`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'SELECT * FROM foo'
      const level = 'strong'
      const apiQuery = { q: sql, level }
      const scope = querySuccess({ url: HOST, path: PATH_QUERY, query: apiQuery })
      const res = await dataApiClient.query(sql, { level, raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP POST if sql is an array`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = ['SELECT * FROM foo', 'SELECT * FROM bar']
      const level = 'weak'
      const apiQuery = { level }
      const scope = queryMultipleSuccess({
        url: HOST, path: PATH_QUERY, query: apiQuery, body: sql,
      })
      const res = await dataApiClient.query(sql, { level, raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_MULTIPLE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('DataApiclient.execute()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a query using HTTP POST`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.execute(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
  })
  describe('DataApiclient.insert()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing an insert`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.insert(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('DataApiclient.update()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing an update`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'UPDATE foo SET name="fionaTest" WHERE name="fiona"'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.update(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('DataApiclient.delete()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a delete`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'DELETE FROM foo WHERE name="fiona"'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.delete(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('DataApiclient.createTable()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a create table`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.createTable(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('DataApiclient.dropTable()', () => {
    it(`should call ${HOST}${PATH_EXECUTE} endpoint with a request body using HTTP POST when performing a drop table`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'DROP TABLE foo'
      const scope = executeSuccess({ url: HOST, path: PATH_EXECUTE, body: [sql] })
      const res = await dataApiClient.dropTable(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(EXECUTE_SUCCESS_RESPONSE, res.body)
    })
  })
  describe('DataApiclient.select()', () => {
    it(`should call ${HOST}${PATH_QUERY} endpoint with a query using HTTP GET when using select`, async () => {
      const dataApiClient = new DataApiClient(HOST)
      const sql = 'SELECT * FROM foo'
      const query = { q: sql }
      const scope = querySuccess({ url: HOST, path: PATH_QUERY, query })
      const res = await dataApiClient.select(sql, { raw: true })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
  })
})