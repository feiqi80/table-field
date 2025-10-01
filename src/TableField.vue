<template>
  <el-popover :placement="placement" :popper-class="`tf-popover ${popClass}`" @hide="onHide" @show="onShow">
    <template #reference>
      <div ref="tfRef">
        <slot name="head">
          <div class="tf-btn">列操作</div>
        </slot>
      </div>
    </template>
    <template v-if="show">
      <div :style="{maxHeight: `${popHeight}px`}">
        <div>
          <el-checkbox v-model="selectAll">全选</el-checkbox>
          <p v-if="reverseSelect" @click="onClickReverse">反选</p>
          <p v-if="defaultFields?.length" @click="() => onSetDefault(true)">恢复默认</p>
        </div>      
        <div>
          <div v-for="item in selectedFields" :id="`tf-${item.value}-${uniqueId}`" :key="item.value" class="tf-item" @mouseenter="onMouseEnter">
            <div>
              <el-checkbox v-model="item.show" @change="onSelectChange">{{item.label}}</el-checkbox>
              <div @mousedown="onStartDrag">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-popover>
</template>


<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import type { TableColumnCtx } from "element-plus";
  import Tools from "./tools";


  /** 表头类型 */
  interface ColumnType extends TableColumnCtx<any> {
    rank: number;
    show: boolean;
  }

  /** 组件props类型 */
  interface PropsType {
    /** 表头 */
    modelValue: ColumnType[];
    /** 表名 */
    tableName: string;
    /** 反选 */
    reverseSelect?: boolean;
    /** 默认展示的字段 */
    defaultFields?: string[];
    /** 操作列标识 */
    actionField?: string;
    /** popper-class样式名 */
    popClass?: string;
    /** 拖拽字段样式名 */
    dragClass?: string;
  }

  /** 选中字段类型 */
  interface SelectedType {
    /** 字段中文名称 */
    label: string;
    /** 字段名称 */
    value: string;
    /** 是否显示 */
    show: boolean;
  }

  /** 惟一值，用于区分多个组件 */
  const uniqueId = Math.floor(Math.random()*100000);

  const props = withDefaults(defineProps<PropsType>(), {
    reverseSelect: false,
    defaultFields: () => [],
    actionField: "action",
    popClass: "",
    dragClass: ""
  });
  const emit = defineEmits<{
    (e: "update:modelValue", value: ColumnType[]): void
  }>()

  /** 传入的表头 */
  const originColumns = ref<ColumnType[]>(props.modelValue);
  /** 选中、排序的字段 */
  const selectedFields = ref<SelectedType[]>([]);
  /** 高度 */
  const popHeight = ref(0);
  /** 显示/隐藏内容，组件只是隐藏，并没有销毁，因为本组件使用了id，所以不销毁的话，会导致id重复。 */
  const show = ref(false);
  /** 插槽元素实例 */
  const tfRef = ref<HTMLDivElement>();
  /** 位置 */
  const placement = ref("bottom-end");
  /** 全选，v-model需要双向绑定，不能只写 computed(() => {})，需要get和set方法。 此时页面不再需要change方法了 */
  const selectAll = computed({
    get: () => selectedFields.value.every(ele => ele.show),
    set: (bool: boolean) => {
      selectedFields.value.forEach(ele => {
        ele.show = bool;
      });
      storeSelectedFields();
    }
  })
  /** 左冻结列数 */
  let leftFreezeNum = 0;
  /** 右冻结列数 */
  let rightFreezeNum = 0;
  /** 需要排序的元素 */
  let dragDomId = "";
  /** 元素移开后的空白区域的Y坐标，比如：某个元素开始拖动，那么它原来的地方就是空白区域。或者交换位置后的空白区域。 */
  let blankY = 0;
  /** 鼠标按下时的Y坐标 */
  let clickY = 0;
  /** 暂存需要排序的元素的id，排序结束后根据ids更新selectedFields */
  let ids: string[] = [];


  /**
   * 更新表头
   */
  const setNewColumns = () => {
    const arr = selectedFields.value;
    let columns = originColumns.value.map(ele => {
      if (ele.type === "selection") {
        ele = {
          ...ele,
          rank: -1,
          show: true
        }
      } else {
        const index = arr.findIndex(elem => elem.value === ele.prop);
        ele = {
          ...ele,
          rank: index < 0 ? arr.length : index,
          show: index < 0 ? true : arr[index].show
        }
      }
      return ele;
    }).filter(ele => ele.show).sort((a, b) => a.rank - b.rank);
    columns = Tools.setColumnFreeze(columns, leftFreezeNum, rightFreezeNum);
    emit('update:modelValue', columns);
  }  

  /**
   * 设置默认展示
   * @param update 是否更新
   */
  const onSetDefault = (update = false) => {
    const defaults = props.defaultFields;
    const allFields = originColumns.value.filter(ele => ele.prop !== props.actionField && ele.type !== "selection");
    const excludeArr = allFields.filter((ele: ColumnType) => defaults.indexOf(ele.prop) < 0).map((ele: ColumnType) => ({ label: ele.label, value: ele.prop, show: !defaults.length }));
    const arr = defaults.map((ele: string) => {
      const obj = allFields.find((elem: ColumnType) => elem.prop === ele);
      return {
        label: obj?.label || "",
        value: obj?.prop || "",
        show: true
      }
    }).filter((ele: SelectedType) => ele.value);
    const list = [...arr, ...excludeArr];
    if (update) {
      selectedFields.value = list;
      storeSelectedFields();
      return [];
    }
    return list;
  }

  /**
   * 初始化设置
   */
  const initColumns = () => {
    const storageObj = Tools.setJsonParse(window.localStorage.getItem("table-field"), {});
    let obj: {[key: string]: boolean} = storageObj[props.tableName] || {}; 
    let storeArr = Object.entries(obj).map(([key, value]) => ({
      label: "",
      value: key,
      show: value,
    }));
    
    // 去除“操作”、“复选框”列，顺便计算左右冻结列数。
    const allFields = originColumns.value.filter(ele => {
      if (ele.fixed === "left") {
        leftFreezeNum++;
      }
      if (ele.fixed === "right") {
        rightFreezeNum++;
      }
      return ele.prop !== props.actionField && ele.type !== "selection"
    });

    if (storeArr.length) {
      const fields = storeArr.map(ele => ele.value);
      // 去除storeArr中不存在的字段
      fields.forEach((ele) => {
        if (allFields.findIndex(elem => elem.prop === ele) < 0) {
          storeArr = storeArr.filter(elem => elem.value !== ele);
        }
      })
      // 再把新的字段添加到storeArr中，顺便给storeArr中label为空的赋值。
      const list = allFields
      .filter(ele => {
        const index = storeArr.findIndex(elem => elem.value === ele.prop);
        if (index > -1) {
          storeArr[index].label = ele.label;
        }
        return index < 0
      })
      .map(ele => ({label: ele.label, value: ele.prop, show: true}));
      storeArr.push(...list);
    } else {
      storeArr = onSetDefault();
    }
    selectedFields.value = storeArr;
    setNewColumns();
  }

  initColumns();

  /**
   * 存储选中字段
   */
  const storeSelectedFields = () => {
    const obj = selectedFields.value.reduce((prev: {[key: string]: boolean}, ele: SelectedType) => {
      return {
        ...prev,
        [ele.value]: ele.show
      }
    }, {});
    const storageObj = Tools.setJsonParse(window.localStorage.getItem("table-field"), {});
    storageObj[props.tableName] = obj;
    window.localStorage.setItem("table-field", JSON.stringify(storageObj));
    setNewColumns();
  }

  const onSelectChange = () => {
    storeSelectedFields();
  }


  const getDomId = (dom: HTMLElement) => {
    const id = dom.getAttribute("id")!;
    const arr = id.split("-");
    return arr[1] || "";
  }

  /**
   * 交换位置
   * 
   * 注：
   * 交换位置的元素如果translate有值，说明已经交换过一次，此时再次交换需要加上当前translate的值。
   * 
   * @param targetDom 交换位置的元素
   */
  const changePosition = (targetDom: HTMLElement) => {
    const targetDomRect = targetDom.getBoundingClientRect();
    const targetY = targetDomRect.top;
    const moveY = blankY - targetY;
    const y = +(targetDom.style.transform ? targetDom.style.transform.replace("translateY", "").replace("(", "").replace(")", "").replace(/px/g, "") : 0);
    targetDom.style.transform = `translateY(${moveY + y}px)`;
    targetDom.style.transition = "0.2s";

    // 更新排序
    const targetDomId= getDomId(targetDom);
    const dragDomIndex = ids.indexOf(dragDomId);
    const targetDomIndex = ids.indexOf(targetDomId);
    ids[dragDomIndex] = ids.splice(targetDomIndex, 1, ids[dragDomIndex])[0];

    // 更新待填补空白区域位置
    blankY = targetY;
    setTimeout(() => {
      targetDom.style.transition = "";
    }, 200);
  }

  /**
   * 鼠标按下
   */
  const onStartDrag = (e: MouseEvent) => {
    e.preventDefault();
    ids = selectedFields.value.map(ele => ele.value);
    const dragDom = ((e.currentTarget as HTMLElement).parentNode as HTMLElement).parentNode as HTMLElement;
    dragDom.classList.add("begin-drag");
    props.dragClass && (dragDom.classList.add(props.dragClass))
    dragDomId = getDomId(dragDom);
    const dragRect = dragDom.getBoundingClientRect();
    blankY = dragRect.top;
    clickY = e.clientY;
    
    /** 
     * 结束排序方法
     */
    const finishSort = () => {
      dragDom.classList.remove("begin-drag");
      props.dragClass && (dragDom.classList.remove(props.dragClass));
      const rect = dragDom.getBoundingClientRect();
      const pY = rect.top;
      dragDom.style.transform = `translateY(${blankY - pY}px)`;
      const list = ids.reduce((prev: SelectedType[], ele: string) => {
        const item = selectedFields.value.find(elem => elem.value === ele) as SelectedType;
        const dom = document.querySelector(`#tf-${ele}-${uniqueId}`) as HTMLElement;
        dom && (dom.style.transform = "");
        return [...prev, item];
      }, []);
      selectedFields.value = list;
      storeSelectedFields();
      window.onmouseup = null;
      window.onmousemove = null;
      window.onmouseleave = null;
      dragDomId = "";
      blankY = 0;
      clickY = 0;
    }

    /** 
     * 鼠标移动方法
     */
    window.onmousemove = (ev: MouseEvent) => {
      ev.preventDefault();
      const eventY = ev.clientY;
      const movedY = eventY - clickY;
      dragDom.style.transform = `translateY(${movedY}px)`;
    };

    /** 
     * 鼠标抬起方法
     */
    window.onmouseup = window.ontouchend = () => {
      finishSort();
    }

    /**
     * 鼠标移出容器
     */
    window.onmouseleave = window.ontouchcancel = () => {
      finishSort();
    }
  }

  /**
   * 元素交换位置
   */
  const onMouseEnter = (e: MouseEvent) => {    
    if (dragDomId) {
      changePosition(e.currentTarget as HTMLLIElement);
    }
  }

  /**
   * 设置高度
   */
  const setPopHeight = () => {
    const dom = tfRef.value;
    const h = document.documentElement.clientHeight || document.body.clientHeight;
    if (dom) {
      const rect = dom.getBoundingClientRect();
      if (rect.top > (h/2)) {
        placement.value = "top-end";
        popHeight.value = rect.top - 20;
      } else {
        placement.value = "bottom-end";
        popHeight.value = h - rect.bottom - 20;
      }      
    }
  }

  onMounted(() => {
    setPopHeight();
    window.addEventListener("resize", setPopHeight);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", setPopHeight);
  })

  const onHide = () => {
    show.value = false;
  }

  const onShow = () => {
    setPopHeight();
    show.value = true;
  }

  /**
   * 反选
   */
  const onClickReverse = () => {
    selectedFields.value.forEach(ele => {
      ele.show = !ele.show;
    });
    storeSelectedFields();
  }
</script>


<style lang="less" scoped>
  .tf-btn {
    width: 85px;
    text-align: center;
    height: 32px;
    line-height: 32px;
    padding: 0 10px;
    border-radius: 4px;
    background: var(--el-color-primary);
    color: #fff;
    cursor: default;
  }

  :global(.tf-popover) {
    width: max-content !important;
    padding: 0 !important;
  }

  :global(.tf-popover .el-popper__arrow) {
    left: initial !important;
    right: 20px !important;
  }

  .tf-popover {
    > div {
      display: flex;
      flex-direction: column;
      > div {
        &:nth-child(1) {
          padding: 0 14px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: center;
          justify-items: flex-start;
          border-bottom: solid 1px #eee;
          flex-shrink: 0;
          .el-checkbox {
            height: 40px;
            margin-right: 0;
          }
          > p {
            color: var(--el-color-primary);
            cursor: pointer;
          }
        }
        &:nth-child(2) {
          overflow-y: auto;
          padding: 4px 0;
          flex: 1;
          > .tf-item { 
            position: relative;
            padding: 0 8px;
            > div {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              padding: 0 6px;

              label {
                flex: 1;
              }
              > div {
                width: 18px;
                height: 17px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                cursor: move;
                span {
                  display: block;
                  width: 100%;
                  height: 3px;
                  background-color: #999;
                  border-radius: 6px;
                }
                &:hover {
                  span {
                    background-color: var(--el-color-primary);
                  }
                }
              }
            }
            
            &.begin-drag {
              z-index: 9999;
              pointer-events: none;
              > div {
                box-shadow: 0 0 6px 3px var(--el-color-primary);          
                border-radius: 4px;
                background-color: #fff;
              }        
            }
          }
        }
      }
    }
  }
</style>