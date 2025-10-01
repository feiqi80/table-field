import TableField from "./TableField.vue";

export { TableField }

// export default {
//   install(app) {
//     app.component('TableField', TableField)
//   }
// }

/**
 * 同时使用默认导出和命名导出的话，
 * ES Modules 环境下可以正常使用两种导出方式
 * CommonJS 环境下会出现需要 require('lib').default 的情况
 * 且打包时，会出现警告。
 * 所以采用下面的方式。
 */
export const Table_Field = (app) => {
  app.component('table-field', TableField);
}