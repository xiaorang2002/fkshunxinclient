// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import {CARD_COMBINATION_NUM } from "./cpDefines";

const {ccclass, property} = cc._decorator;

// 手牌控制
@ccclass
export default class cpHandCardControl {

    // @property(cc.Label)
    // label: cc.Label = null;
    handCardIndex:number[];
    
    start () {
    }

    // update (dt) {}

    // 理牌操作

    // 玩家出牌

    // 玩家手牌

    // 开始发牌

    // 计算坨数, 计算可能有的组合数


    // 计算两个牌值加起来是否能形成(能否形成一个组合) 坨


    //添加组合

    // 坨数组合                 1

    // 吃牌组合 碰牌组合        1

    // 计算列数                1

    // 扑克move动作

    // 扑克选中变色动作         1

    // 扑克移动动作

    // 碰牌/ 出牌 / 移动牌之后  扑克都有移动的动作  准确的说 所有扑克位置改变时候  都有移动的动作

    // 滑动出牌 有的动作(移动 目标pos->x缩小变大->)

    // 手牌增加/减少每一列 均有移动动画(有加速度), 

    // 选牌 拖牌  也均有移动动作(有加速度)

    // 单例扑克 层级 位置
}
