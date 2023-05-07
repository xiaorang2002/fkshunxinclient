import { GameManager } from './../../../GameManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GAME_TYPE } from './../../../data/GameConstValue';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { Utils } from "../../../../framework/Utils/Utils";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export default class infoGameUI extends BaseUI {
    protected static className = "infoGameUI";
    public static actionSprite: cc.Node = null;
    public static actionState = false;
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_SYSTEM_DIR + this.className;
    }

    @property(cc.Prefab)
    emotePrefab: cc.Prefab = null;
    @property(cc.Label)
    label_name: cc.Label = null;
    @property(cc.Label)
    label_id: cc.Label = null;
    @property(cc.Sprite)
    sp_head: cc.Sprite = null;
    @property(cc.Node)
    node_gril: cc.Node = null;
    @property(cc.Node)
    node_boy: cc.Node = null;
    @property(cc.Node)
    node_tiren: cc.Node = null;
    @property(cc.Node)
    emote_content: cc.Node = null;
    @property(cc.Node)
    no_usesp: cc.Node = null;
    @property(cc.SpriteFrame)
    sprite_res: cc.SpriteFrame[] = [];

    private spacing: number = 17;
    private gameType = null;
    private itemList = [];
    private magicPrice = 0;

    onLoad() {
        super.onLoad()
    }
    start() {
    }

    initData(seat) {
        try
        {
            var gameinfo = GameDataManager.getInstance().getDataByCurGameType().gameinfo
            this.gameType = GameDataManager.getInstance().curGameType
            this.magicPrice = 0
            this.initUI(seat)
            var playerStart = gameinfo.tableStarted
            if (this.gameType == GAME_TYPE.ZJH)
                playerStart = GameDataManager.getInstance().getDataByCurGameType().playerInfoMap.get(seat).isGaming
            this.setBtn(seat, gameinfo.creator, playerStart);
        }
        catch (e){
            console.log(e)
            GameManager.getInstance().openWeakTipsUI("玩家信息不存在");
            UIManager.getInstance().closeUI(infoGameUI);
        }
    }
    initUI(seat) {
        var data = GameDataManager.getInstance().getDataByCurGameType().playerInfoMap.get(seat)
        this.setName(data);
        this.setId(data);
        this.setHead(data);
        this.setSex(data);
        this.initScrollContent(data);
        this.setSore(data)
    }
    /**设置名字 */
    setName(data) {
        this.label_name.string = Utils.getShortName(data.name);
    }
    /**设置id */
    setId(data) {
        this.label_id.string = data.id.toString();
    }
    /**设置头像 */
    setHead(data) {
        Utils.loadTextureFromNet(this.sp_head, data.headurl)
    }
    /**设置性别 */
    setSex(data) {
        this.node_boy.active = data.sex == 1;
        this.node_gril.active = data.sex == 2
    }
    
    setSore(data)
    {
        if (data.score > 0)
        {
            this.node.getChildByName("score_bg").active = true;
            this.node.getChildByName("score_bg").getChildByName("Label_score").getComponent(cc.Label).string = data.score
        }
    }

    setBtn(seat, id, isgame) {
        this.node_tiren.active = true;
        this.node_tiren.scale = 0.8
        var data = GameDataManager.getInstance().getDataByCurGameType().playerInfoMap.get(seat)
        var ok1 = (GameDataManager.getInstance().userInfoData.userId == id && data.id != GameDataManager.getInstance().userInfoData.userId)
        var ok2 = !isgame;
        var ok3 = false;
        var rule = GameDataManager.getInstance().getDataByCurGameType().gameinfo.rule
        if (rule.option.owner_kickout_player != false)
            ok3 = true;
            
        this.node_tiren.getComponent(cc.Button).interactable = (ok1 && ok2 && ok3)
        //this.node.getChildByName("btn_ti").getChildByName("New Label").getComponent(cc.LabelOutline).enabled = (ok1 && ok2 && ok3);
    }

    initScrollContent(data) {
        var ok = (GameDataManager.getInstance().userInfoData.userId == data.id)
        for (var i = 0; i < 5; ++i) {
            let item = cc.instantiate(this.emotePrefab);
            this.emote_content.addChild(item);
            let emoteItemComponent = item.getComponent('emoteInfoitemUI');
            emoteItemComponent.setPrice(this.magicPrice);
            emoteItemComponent.setSpriteIndex(i, this.sprite_res[i]);
            emoteItemComponent.setPlayerChairId(data.seat);
            if (ok) {
                emoteItemComponent.setGray();
                this.no_usesp.active = true;
            }
            else
                this.no_usesp.active = false;
            item.setPosition(item.width / 2 + item.width * i + this.spacing * i, -item.height / 2);
            this.itemList.push(item);
        }

    }
    btn_close() {
        UIManager.getInstance().closeUI(infoGameUI);
    }
    /**踢人按钮 */
    btn_tiren() {
        AudioManager.getInstance().playSFX("button_click");
        var gameData = GameDataManager.getInstance().getDataByCurGameType()
        if (!gameData)
            return;
        MessageManager.getInstance().messageSend(Proto.CS_ForceKickoutPlayer.MsgID.ID, { guid:parseInt(this.label_id.string), clubId: gameData.gameinfo.clubId});
        this.btn_close();
    }

    public static playeMoveAction(parent, startPos: cc.Vec2, endPos: cc.Vec2, emojiID: number, cbFunc) {
        try
        {
            var startPos = startPos;
            var endPos = endPos;
            if (this.actionSprite == null) {
                this.actionSprite = new cc.Node();
                this.actionSprite.addComponent(cc.Sprite);
            }
            this.actionSprite.parent = parent;
            this.actionSprite.active = true;
            Utils.loadTextureFromLocal(this.actionSprite.getComponent(cc.Sprite),
                "/info_emoji/emoji_" + emojiID, function () {
                    let action_1 = cc.place(startPos);
                    let action_2 = cc.moveTo(0.6, endPos);
                    let finishCallFunc = cc.callFunc(function () {
                        if (infoGameUI.actionSprite.parent)
                            infoGameUI.actionSprite.parent.removeChild(infoGameUI.actionSprite);
                        if (cbFunc != null)
                            cbFunc();
                    }, this);
                    let seq = cc.sequence(action_1, action_2, finishCallFunc);
                    infoGameUI.actionSprite.stopAllActions();
                    infoGameUI.actionSprite.runAction(seq);
                });
        }
        catch (e)
        {
            infoGameUI.actionSprite.stopAllActions();
        }

    }


}
