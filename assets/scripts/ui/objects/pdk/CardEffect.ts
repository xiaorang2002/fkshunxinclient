import { GAME_TYPE } from './../../../data/GameConstValue';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";

const { ccclass, property } = cc._decorator;

// 斗地主和跑得快的特效文件

@ccclass
export class CardEffect extends BaseUI {
    protected static className = "CardEffect";
    @property(cc.Animation)
    nodeAnim: cc.Animation[] = [];
    @property(cc.Node)
    playerNodeAnim: cc.Node[] = [];

    /**动画控制器 */
    private isPlayEffect = false;
    /**动画队列 */
    private effectList = [];

    onLoad() {
        
    }

    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_PDK_DIR + this.className;
    }

    initData() {
        this.isPlayEffect = false;
        this.effectList = []
    }
    start() {
        this.initData();
        
    }

    /**改变动画 */
    private playeEffect(aniObj, gameType = 0) {
        //牌型 1:单张 2:对子 3:顺子 4:连对 5:三不带 6:三带一 7:三带二 8:四带二 9:四带三 10:飞机 11:飞机带单 12飞机带对 13:炸弹

        //20 打开警报  21 关闭报警  22 春天 23 地主胜利 24 农民胜利
        // this.node.active = true;
        // if (this.isPlayEffect) {
        //     this.effectList.push(aniObj);
        //     return
        // }
        // this.isPlayEffect = true;
        if (aniObj.type == 14) {

            this.nodeAnim[0].node.active = true;
            this.nodeAnim[0].play("huojian");
            this.nodeAnim[0].on('finished', this.onFinish, this);
        }
        else if (aniObj.type == 13) {

            this.nodeAnim[1].node.active = true;
            this.nodeAnim[1].play("zhadan");
            this.nodeAnim[1].on('finished', this.onFinish, this);
        }
        else if ((aniObj.type >= 10 && aniObj.type <= 12) || aniObj.type == 15) {
            this.nodeAnim[2].node.active = true;
            this.nodeAnim[2].play("feijidonghua");
            this.nodeAnim[2].on('finished', this.onFinish, this);
        }
        else if (aniObj.type == 3) {
            this.updatePosByGameType(aniObj.realSeat, gameType, "shunzi");
            this.playerNodeAnim[aniObj.realSeat].getChildByName("shunzi").active = true;
            this.playerNodeAnim[aniObj.realSeat].getChildByName("shunzi").getComponent(cc.Animation).play("shunzi");
            this.playerNodeAnim[aniObj.realSeat].getChildByName("shunzi").getComponent(cc.Animation).on('finished', this.onFinish, this);
        }
        else if (aniObj.type == 4) {
            this.updatePosByGameType(aniObj.realSeat, gameType, "liandui");
            this.playerNodeAnim[aniObj.realSeat].getChildByName("liandui").active = true;
            this.playerNodeAnim[aniObj.realSeat].getChildByName("liandui").getComponent(cc.Animation).play("liandui");
            this.playerNodeAnim[aniObj.realSeat].getChildByName("liandui").getComponent(cc.Animation).on('finished', this.onFinish, this);
        }
        else if (aniObj.type == 20) {
            if(aniObj.realSeat == 0)
                return
            this.playerNodeAnim[aniObj.realSeat].getChildByName("jingbao").active = true;
        }
        else if (aniObj.type == 22) {
            this.nodeAnim[3].node.active = true;
            this.nodeAnim[3].play("chuntian");
            this.nodeAnim[3].on('finished', this.onFinish, this);
        }
        else if (aniObj.type == 23) {
            this.nodeAnim[4].node.active = true;
            this.nodeAnim[4].play("dizhushengli");
            this.nodeAnim[4].on('finished', this.onFinish, this);
        }
        else if (aniObj.type == 24) {
            this.nodeAnim[5].node.active = true;
            this.nodeAnim[5].play("nongminshengli");
            this.nodeAnim[5].on('finished', this.onFinish, this);
        }
    }
    
    private updatePosByGameType(seat, gameType, nodeType){
        if (gameType == GAME_TYPE.SCPDK)
        {
            if (seat == 1 || seat == 3)
                this.playerNodeAnim[seat].getChildByName(nodeType).y = -25
            if (seat == 1)
                this.playerNodeAnim[seat].getChildByName(nodeType).x = 115
            if (seat == 2)
                this.playerNodeAnim[seat].getChildByName(nodeType).x = -164
            if (seat == 3)
                this.playerNodeAnim[seat].getChildByName(nodeType).x = -65
        }
        else
        {
            if (seat == 1 || seat == 3)
                this.playerNodeAnim[seat].getChildByName(nodeType).y = 50
            if (seat == 1)
                this.playerNodeAnim[seat].getChildByName(nodeType).x = 90
            if (seat == 2)
                this.playerNodeAnim[seat].getChildByName(nodeType).x = -192
            if (seat == 3)
                this.playerNodeAnim[seat].getChildByName(nodeType).x = -90
        }
    }

    //动画完成回调
    onFinish() {
        this.isPlayEffect = false;
        for (var nodeAni of this.nodeAnim)
            nodeAni.node.active = false
        // if (this.effectList.length > 0) {
        //     var obj = this.effectList.shift()
        //     this.playeEffect(obj)
        // }
        // else
        // UIManager.getInstance().hideUI(CardEffect)
    }
    
    removeEffect() {
        this.isPlayEffect = false;
        for (var playerNode of this.playerNodeAnim)
            playerNode.getChildByName("jingbao").active = false;
        for (var nodeAni of this.nodeAnim)
            nodeAni.node.active = false
        // this.effectList = [];
    }
}
