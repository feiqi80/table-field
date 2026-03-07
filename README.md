English | [中文](./README.zh-CN.md)

# Table Column Manager

![Table Column Manager](https://showscene.oss-cn-shanghai.aliyuncs.com/table-field.gif)


Demo：[Live demo](http://showscene.cn/vue-demo/user/list)

This is a component used to control table column visibility, ordering, and configuration.

It is built with Vue 3 + TypeScript + Element Plus and provides the following features:
- Show / hide table columns
- Drag to reorder columns
- Select all columns
- Reverse selection
- Restore default column configuration
- Persist column state in the browser (localStorage)

**Note: Multi-level table headers are not supported**

## Installation
```bash
npm i table-field
```
or
```bash
yarn add table-field
```

## Import
```bash
import { TableField } from "table-field";

// Starting from version 1.0.7, CSS import is no longer required
// import "table-field/dist/table-field.css";
```

## Or Global Installation
```bash
// In main.ts:

import { Table_Field } from "table-field";
// Starting from version 1.0.7, CSS import is no longer required
// import "table-field/dist/table-field.css";

app.use(Table_Field);
```

## Usage
```vue
<template>
  <table-field
    v-model="columns"
    tableName="user"
  />

  <el-table>
    <el-table-column 
      v-for="item in columns" :key="item.prop"
      v-bind="item"
    >
      ... ... ...
      ... ... ...
    </el-table-column>
  </el-table>
</template>

<script>
  import { TableField } from "table-field";  


  const columns = ref([
    {type: "selection", width: 50, fixed: "left"},
    {label: "ID", prop: "id", width: 100, fixed: "left"},
    {label: "用户名", prop: "username", width: 120},
    {label: "姓名", prop: "name", width: 120},
    {label: "手机", prop: "phone", width: 150},
    {label: "邮箱", prop: "email", width: 200},
    ... ...
    ... ...
    {label: "操作", prop: "action", width: 150, fixed: "right", render: ({row}) => {
      return h('div', { }, [
        h(ElButton, {}, () => '编辑'),
        h(ElButton, {}, () => '删除'),
      ])
    }}
  ]);
</script>
```

### Component Props
```js
/** Table column configuration */
modelValue: ColumnType[];
/** Table name used as the key in localStorage */
tableName: string;
/** Enable reverse selection */
reverseSelect?: boolean;
/** Default visible fields */
defaultFields?: string[];
/** Action column identifier (default: prop = "action"). This column will not be displayed */
actionField?: string;
/** Popper class name */
popClass?: string;
/** Dragging item class name */
dragClass?: string;
```

## Slots
```bash
head：Custom header content.，Default “Column Settings”
```

# Changelog

## [1.0.9] - 2026-03-07
### Changes
- Added English documentation.

## [1.0.8] - 2025-11-30
### Changes
- Updated README content.

## [1.0.7] - 2025-11-16
### Changes【Breaking Change】
- Removed the import of "table-field/dist/table-field.css".
- Updated README content.

## [1.0.6] - 2025-09-19
### Changes
- Updated README content.

## [1.0.5] - 2025-09-14
### Changes
- Added automatic popover position adjustment.
- Improved global uniqueness of the popover.
- Optimized the head slot element instance.

## [1.0.4] - 2025-06-29
### Changes
- Added changelog to README.

## [1.0.3] - 2025-06-28
### Changes
- Updated README content.

## [1.0.2] - 2025-06-28
### Changes
- Naming convention update: defaultfields renamed to defaultFields.

## [1.0.1] - 2025-06-28
### Changes
- Added changelog.
- Updated component description.

## [1.0.0] - 2025-06-27
### Initial release.
