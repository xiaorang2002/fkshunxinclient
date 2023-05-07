import { ListenerType } from './../data/ListenerType';
import { GameUI_JF } from './GameUI_JF';
import { GAME_STATE_DDZ } from './../data/ddz/GameInfo_DDZ';
import { GAME_TYPE } from './../data/GameConstValue';
import { ShowRuleUI } from './objects/rule/ShowRuleUI';
import { GameSettingUI } from './GameSettingUI';
import { UIManager } from './../../framework/Manager/UIManager';
import { AudioManager } from './../../framework/Manager/AudioManager';
import { GAME_STATE_MJ } from './../data/mj/defines';
import { Utils } from './../../framework/Utils/Utils';
import { GameDataManager } from '../../framework/Manager/GameDataManager';
import { SdkManager } from '../../framework/Utils/SdkManager';
import { ListenerManager } from "../../framework/Manager/ListenerManager";
import { BaseUI } from '../../framework/UI/BaseUI';
import { GameManager } from '../GameManager';

const { ccclass, property } = cc._decorator;

@ccclass
export class GameUI_TopInfo extends BaseUI {
    protected static className = "GameUI_TopInfo";
    /*
    游戏顶部信息栏（通用）
    */

    @property(cc.ProgressBar)
    battleProgress: cc.ProgressBar = null;
    @property(cc.Label)
    labelTime: cc.Label = null;
    @property(cc.Label)
    labelRoomId: cc.Label = null;
    @property(cc.Label)
    labelRound: cc.Label = null;
    @property(cc.Label)
    labelLeftNum: cc.Label = null;
    @property(cc.Label)
    labelClubId: cc.Label = null;
    @property(cc.Label)
    labelSigle: cc.Label = null;
    @property(cc.Node)
    LaiZiNode: cc.Node = null;
    @property(cc.Sprite)
    pingLv: cc.Sprite = null
    @property({ type: [cc.SpriteFrame] })
    pingLvArg: Array<cc.SpriteFrame> = []

    private m_gameType = 0; // 游戏类型
    private m_gameData = null; // 游戏数据d
    private m_curUpdateTime = 1; // 两秒更新一次电量和时间

    onLoad() {
    }

    onDestroy() {
        super.onDestroy();
        this.m_gameData = null
    }
    resetDataOnBack() {
        this.m_gameData = GameDataManager.getInstance().getDataByCurGameType();
    }

    public onEventHideRec() {
        this.m_gameData = null
    }

    public onDataRecv() {
        this.m_gameData = GameDataManager.getInstance().getDataByCurGameType();
        this.m_gameType = GameDataManager.getInstance().curGameType
        this.initListen()
        this.setRoomId();
        this.setClubId();
        this.setRound();
        this.updateDdzView()
        if (this.m_gameData.gameinfo.rule.option.gps_distance > 0) {
            this.updateGps()
            this.node.getChildByName("gps").active = this.m_gameData.gameinfo.curRound == 0
            this.node.getChildByName("button_gps").active = true;
        }

    }

    public onShow() {
        this.m_gameData = GameDataManager.getInstance().getDataByCurGameType();
        this.m_gameType = GameDataManager.getInstance().curGameType
        this.setRoomId();
        this.setClubId();
        this.updateGps()
    }

    /**初始化监听 */
    private initListen() {

        if (GameDataManager.getInstance().curGameType == GAME_TYPE.PDK || GameDataManager.getInstance().curGameType == GAME_TYPE.LRPDK || GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK) {
            ListenerManager.getInstance().add(ListenerType.pdk_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
            ListenerManager.getInstance().add(ListenerType.pdk_curRoundChange, this, this.setRound);
        }
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ) {
            ListenerManager.getInstance().add(ListenerType.pdk_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
            ListenerManager.getInstance().add(ListenerType.pdk_curRoundChange, this, this.setRound);
            ListenerManager.getInstance().add(ListenerType.ddz_landlordCardsChange, this, this.setDdzLandlordCards);
            ListenerManager.getInstance().add(ListenerType.ddz_multipleChange, this, this.setDdzTimes);
            ListenerManager.getInstance().add(ListenerType.ddz_baseScoreChange, this, this.setDdzScore);
            ListenerManager.getInstance().add(ListenerType.ddz_gameState, this, this.onDDZGameStateChanged);

        }
        else if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGCP) {
            ListenerManager.getInstance().add(ListenerType.cp_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
            ListenerManager.getInstance().add(ListenerType.cp_curRoundChange, this, this.setRound);
        }
        else {
            ListenerManager.getInstance().add(ListenerType.mj_playerNumChanged, this, this.onPlayerNumChanged);                     // 收到玩家人数改变
            ListenerManager.getInstance().add(ListenerType.mj_curRoundChange, this, this.setRound);
        }
    }

    update(dt) {
        this.m_curUpdateTime -= dt;
        if (this.m_curUpdateTime < 0) {
            this.m_curUpdateTime = 3;
            this.updatePhoneInfo();
        }
    }

    updatePhoneInfo() {
        this.setTime();
        this.setBattle();
        this.setSignal();
    }



    //设置房间号
    private setRoomId(room?) {
        if (room) {
            this.labelRoomId.string = room;
        }
        else {
            this.labelRoomId.string = this.m_gameData.gameinfo.roomId.toString();
        }

    }

    private onDDZGameStateChanged() {
        var targetNodeStr = "node_ddz_top"
        if (this.m_gameData && this.m_gameData.getCurTypePlayerNum() == 2)
            targetNodeStr = "node_ddz_right"
        // 当状态为准备时不显示
        this.node.getChildByName(targetNodeStr).active = this.m_gameData.gameinfo.gameState != GAME_STATE_DDZ.PER_BEGIN
    }

    /**设置癞子牌 */
    private setLaizi() {
        if (!this.m_gameData.gameinfo.rule.isAutoHaoZhi) {
            this.LaiZiNode.active = false;
            return;
        }
        if ((this.m_gameData.gameinfo.laiZhiCards && this.m_gameData.gameinfo.laiZhiCards.length == 0) || this.m_gameData.gameinfo.laiZhiCards == null || this.m_gameData.gameinfo.laiZhiCards.length < 1) {
            this.LaiZiNode.active = false;
            return;
        }
        var mjsp = this.LaiZiNode.getChildByName("sp").getComponent(cc.Sprite)
        Utils.loadTextureFromLocal(mjsp, "/card_mj/mj_" + this.m_gameData.gameinfo.laiZhiCards[0]);
        this.LaiZiNode.active = true;
    }

    /**设置癞子牌 回放 */
    private setbackLaizi(laiziCards) {
        var mjsp = this.m_gameData.getChildByName("sp").getComponent(cc.Sprite)
        Utils.loadTextureFromLocal(mjsp, "/card_mj/mj_" + laiziCards[0]);
        this.m_gameData.active = true;
    }

    //设置局数
    private setRound(round?, allround?) {
        if (this.m_gameData == null)
            return
        if (this.m_gameData.gameinfo.curRound > 0)
            this.node.getChildByName("gps").active = false
        if (GameDataManager.getInstance().curGameType == GAME_TYPE.PDK || GameDataManager.getInstance().curGameType == GAME_TYPE.LRPDK
            || GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ || GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK
            || GameDataManager.getInstance().curGameType == GAME_TYPE.ZGCP) {
            var labelRound = this.node.getChildByName("layer").getChildByName("label_round").getComponent(cc.Label)
            var type = 1
            this.node.getChildByName("layer").getChildByName("label_title_round").active = true
            this.node.getChildByName("layer").getChildByName("label_round").active = true
        }
        else {
            var type = 2
            this.node.getChildByName("layer").getChildByName("label_title_round").active = false
            this.node.getChildByName("layer").getChildByName("label_round").active = false

        }
        if (round && allround) {
            if (type == 1)
                labelRound.string = round + "/" + allround
        }
        else {
            var curRule = this.m_gameData.gameinfo.rule
            var list = [8, 16];
            if ((GameDataManager.getInstance().curGameType >= GAME_TYPE.XZMJ && GameDataManager.getInstance().curGameType < GAME_TYPE.LRPDK)
                || GameDataManager.getInstance().curGameType == GAME_TYPE.ZGMJ)
                list = [4,6,10,16]
            else if (GameDataManager.getInstance().curGameType == GAME_TYPE.PDK || GameDataManager.getInstance().curGameType == GAME_TYPE.LRPDK
                || GameDataManager.getInstance().curGameType == GAME_TYPE.DDZ || GameDataManager.getInstance().curGameType == GAME_TYPE.SCPDK)
                list = [8, 12, 20]
            else if (GameDataManager.getInstance().curGameType == GAME_TYPE.ZGCP)
                list = [4, 6, 8, 10]
            var ruleJuShu = list[curRule.round.option];
            if (type == 1)
                labelRound.string = this.m_gameData.gameinfo.curRound + "/" + ruleJuShu

        }
        if (type == 1)
            this.node.getChildByName("btn_jf").active = this.m_gameData.gameinfo.curRound > 1
        else
            this.node.getChildByName("btn_jf_mj").active = this.m_gameData.gameinfo.curRound > 1

    }
    //设置亲友群号
    private setClubId(club?) {
        // if (club) {
        //     this.labelClubId.string = club;
        //     this.labelClubId.node.active = true;
        // }
        // else {
        //     if (this.m_gameData.gameinfo.clubId) {
        //         this.labelClubId.string = this.m_gameData.gameinfo.clubId.toString();
        //         this.labelClubId.node.active = true;
        //     }
        //     else {
        //         this.labelClubId.node.active = false;
        //     }
        // }
    }
    //设置时间
    private setTime() {
        var dateTime = new Date(GameDataManager.getInstance().systemData.severTime);
        if (dateTime.getMinutes() < 10) {
            this.labelTime.string = dateTime.getHours() + ":0" + dateTime.getMinutes();
        }
        else {
            this.labelTime.string = dateTime.getHours() + ":" + dateTime.getMinutes();
        }
    }

    private updateDdzView() {
        if (GameDataManager.getInstance().curGameType != GAME_TYPE.DDZ)
            return
        this.setDdzLandlordCards()
        this.setDdzTimes()
        this.setDdzScore()
    }

    private setDdzLandlordCards() {
        var targetNodeStr = "node_ddz_top"
        if (this.m_gameData && this.m_gameData.getCurTypePlayerNum() == 2)
            targetNodeStr = "node_ddz_right"
        var landlordIdCards = this.m_gameData.gameinfo.landlordIdCards
        for (var i = 1; i < 4; i++) {
            var cardId = 0
            var sprite = this.node.getChildByName(targetNodeStr).getChildByName("card_di" + i).getComponent(cc.Sprite)
            if (landlordIdCards.length != 0) {
                cardId = landlordIdCards[i - 1]
                var textureId = Utils.getPdkColorAndMjTextureId(cardId)
            }
            else {
                textureId = 0
            }
            Utils.loadTextureFromLocal(sprite, "/cards/card_s_" + textureId);
        }
    }

    private setDdzTimes() {
        var targetNodeStr = "node_ddz_top"
        if (this.m_gameData && this.m_gameData.getCurTypePlayerNum() == 2)
            targetNodeStr = "node_ddz_right"
        var times = this.m_gameData.gameinfo.multiple
        this.node.getChildByName(targetNodeStr).getChildByName("label_times").getComponent(cc.Label).string = times.toString();
    }

    private setDdzScore() {
        var targetNodeStr = "node_ddz_top"
        if (this.m_gameData && this.m_gameData.getCurTypePlayerNum() == 2)
            targetNodeStr = "node_ddz_right"
        var score = this.m_gameData.gameinfo.baseScore
        this.node.getChildByName(targetNodeStr).getChildByName("label_score").getComponent(cc.Label).string = score.toString();
    }

    //设置电量
    private setBattle() {

        this.battleProgress.progress = SdkManager.getInstance().doGetNativeBatteryLevel();
    }

    //设置信号
    private setSignal() {
        this.labelSigle.string = GameDataManager.getInstance().systemData.ping + "ms";
        this.pingLv.spriteFrame = this.pingLvArg[GameDataManager.getInstance().getNetLevel()]
    }

    /**房间人数变化 */
    private onPlayerNumChanged(msg) {
        if (msg.tag == "remove")
            this.node.getChildByName("gps").getChildByName("node_" + msg.playerSeat).active = false
        this.updateGps()
    }

    private updateGps() {
        if (this.m_gameData.gameinfo.rule.option.gps_distance > 0) // 规则存在gps时才出现
        {
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if (i == j)
                        continue
                    if (i > j)
                        var labelName = "label_" + j + "_" + i
                    else
                        var labelName = "label_" + i + "_" + j
                    this.node.getChildByName("gps").getChildByName(labelName).active = false
                }
                this.node.getChildByName("gps").getChildByName("node_" + i).active = false
            }

            this.m_gameData.playerInfoMap.forEach((infoObj, seat) => {
                this.node.getChildByName("gps").getChildByName("node_" + seat).active = true
                var headNode = this.node.getChildByName("gps").getChildByName("node_" + seat).getChildByName("mask_head").getChildByName("sp_head")     //得到头像节点
                Utils.loadTextureFromNet(headNode.getComponent(cc.Sprite), this.m_gameData.playerInfoMap.get(seat).headurl)
                var pos1 = {
                    longitude: infoObj.longitude,
                    latitude: infoObj.latitude
                }
                for (var tempSeat = 0; tempSeat < 4; tempSeat++) {
                    if (tempSeat == seat || !this.m_gameData.playerInfoMap.get(tempSeat))
                        continue
                    if (tempSeat > seat)
                        var labelName = "label_" + seat + "_" + tempSeat
                    else
                        var labelName = "label_" + tempSeat + "_" + seat
                    var pos2 = {
                        longitude: this.m_gameData.playerInfoMap.get(tempSeat).longitude,
                        latitude: this.m_gameData.playerInfoMap.get(tempSeat).latitude
                    }
                    var length = Utils.calculateLength(pos1, pos2)
                    this.node.getChildByName("gps").getChildByName(labelName).active = true
                    this.node.getChildByName("gps").getChildByName(labelName).getComponent(cc.Label).string = length
                }

            })

        }
    }


    /**设置按钮 */
    private button_set() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_gameData == null)
            return
        UIManager.getInstance().openUI(GameSettingUI, 4);
    }

    /**规则按钮 */
    private button_rule() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_gameData == null)
            return
        let info =
        {
            rule: JSON.stringify(this.m_gameData.gameinfo.rule),
            gameType: GameDataManager.getInstance().curGameType,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
        })
    }

    private button_jf() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_gameData == null)
            return
        UIManager.getInstance().openUI(GameUI_JF, 5)
    }

    private button_gps() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.m_gameData == null)
            return
        var active = this.node.getChildByName("gps").active
        this.node.getChildByName("gps").active = !active
        if (active)
            this.updateGps()
    }

}