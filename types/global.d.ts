import postgres from '../../../tests/helpers/postgresql/index'

declare global {    
  import { App } from "#app"
  var app: App
  declare function fail(expected: any, received?: any, message?: string): void;
  declare var isConnected: boolean;
  declare var postgreSql: postgres
}
declare var app: App
declare var isConnected: boolean;
declare function fail(expected: any, received?: any, message?: string): void;
declare var postgreSql: postgres