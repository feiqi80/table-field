/**
 * 工具类
 *
 * @export
 * @class Tools
 */
const Tools = {

  /**
   * 判断字符串是否能转换
   * @param  str        字符串
   * @param  initValue  报错时赋默认值
   */
  setJsonParse: (str: string | undefined | null, initValue: any) =>  {
    if (!str) {
      return initValue;
    }
    try {
      JSON.parse(str);
      return JSON.parse(str);
    } catch (e) {
      return initValue;
    }
  },

  /**
   * 设置表格冻结列
   * 
   * @param cols            表头
   * @param leftFreezeNum   左冻结列数
   * @param rightFreezeNum  右冻结列数
   */
  setColumnFreeze: (cols: any, leftFreezeNum: number, rightFreezeNum: number) => {
    cols.forEach((ele: any, i: number) => {
      ele.fixed = false;
      const isLeftFreeze = (i + 1) <= (leftFreezeNum || 0);
      const isRightFreeze = i >= (cols.length - (rightFreezeNum || 0));
      if (isLeftFreeze || isRightFreeze) {
        ele.fixed = isLeftFreeze ? "left" : "right"
      }
    });
    return cols;
  },

}

export default Tools;
