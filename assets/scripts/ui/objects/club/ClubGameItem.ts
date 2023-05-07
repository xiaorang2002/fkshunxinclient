import { GAME_TYPE } from './../../../data/GameConstValue';
import { ListenerType } from './../../../data/ListenerType';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { GAME_NAME } from '../../../data/GameConstValue';
import { timeStamp } from 'console';

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubGameItem extends cc.Component {

    @property(cc.Sprite)
    title: cc.Sprite = null;
    @property(cc.Label)
    title_name: cc.Label = null

    @property({ type: [cc.SpriteFrame] })
    titleArg: Array<cc.SpriteFrame> = []

    private gameType = 0
    private idx = 0
    private touchFlag = false
    private touchStartTime = null

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START,this.touchStart,this)
        this.node.on(cc.Node.EventType.TOUCH_END,this.touchEnd,this)
        this.node.on(cc.Node.EventType.TOUCH_CANCEL,this.touchCancel,this)
    }
    touchStart(){
        //触摸开始
        this.touchFlag = true
        //记录触摸开始时间
        this.touchStartTime = new Date().getTime()
    }
    touchEnd(){
        if(this.touchFlag){
            this.touchHold()
        }
    }
    touchCancel(event){
        this.touchFlag = false
        //记录触摸开始时间
        this.touchStartTime = null
    }
    touchHold(){
        if(this.touchFlag && this.touchStartTime != null){
            let touchHoldTime = new Date().getTime()
            if(touchHoldTime - this.touchStartTime > 2000){
                this.touchFlag = false
                this.touchStartTime = null
                let topGameId = cc.sys.localStorage.getItem("topGameId")
                if (topGameId == null || this.gameType != Number(topGameId)) {
                    cc.sys.localStorage.setItem("topGameId",this.gameType)
                    MessageManager.getInstance().messagePost(ListenerType.clubGameTop);
                }else if(topGameId != null && this.gameType == Number(topGameId)){
                    cc.sys.localStorage.removeItem("topGameId")
                    MessageManager.getInstance().messagePost(ListenerType.clubGameTop);
                }
            }
        }
    }
    setInfo(index, gameType) {
        this.idx = index
        this.gameType = gameType
        if (index == 0) {
            this.title.spriteFrame = this.titleArg[0]
            this.title_name.string = "全   部"
        }
        else {
            if (gameType == GAME_TYPE.NN) {
                this.title.spriteFrame = this.titleArg[3]
            } else if (gameType == GAME_TYPE.LRPDK || gameType == GAME_TYPE.PDK || gameType == GAME_TYPE.SCPDK) {
                this.title.spriteFrame = this.titleArg[2]
            } else if (gameType == GAME_TYPE.DDZ) {
                this.title.spriteFrame = this.titleArg[4]
            } else if (gameType == GAME_TYPE.ZJH) {
                this.title.spriteFrame = this.titleArg[5]
            } else {
                this.title.spriteFrame = this.titleArg[1]
            }
            if (GAME_NAME[gameType]) {
                this.title_name.string = GAME_NAME[gameType]
            } else {
                this.title_name.string = " "
            }

        }
    }

    getGameType() {
        return this.gameType
    }

    setSelect(bSelect) {
        this.node.getChildByName('select').active = bSelect
    }

    btn_click(event, customEventData, autoSelect = false) {
        MessageManager.getInstance().messagePost(ListenerType.clubGameSelectChanged, { idx: this.idx, autoSelect: autoSelect })
    }


}

