import { PreferentData } from './../../../data/PreferentData';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameManager } from './../../../GameManager';
import { Utils } from './../../../../framework/Utils/Utils';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import { LogWrap } from "../../../../framework/Utils/LogWrap";
import * as GameConstValue from "../../../data/GameConstValue";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { ClubTableInfoUI } from "./ClubTableInfoUI";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { CLUB_POWER } from "../../../data/club/ClubData";
import { ShowRuleUI } from "../rule/ShowRuleUI";
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubTableItem extends BaseUI {

    protected static className = "ClubTableItem";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }

    @property(cc.Label)
    labelRound: cc.Label = null;
    @property(cc.Label)
    labelTitle: cc.Label = null;
    @property([cc.Sprite])
    spPlayerHead: cc.Sprite[] = [];
    @property({type:[cc.SpriteFrame]})
    spfBG: Array<cc.SpriteFrame> = [];

    private _index: number = 0;
    private _ruleJuShu: number = 0;
    private _roomInfo: any = null;
    private _curRule: any = null;
    private _playerNum: any = 0;
    private _type = 1       // 1 是麻将 0是纸牌 2 炸金花
    private _8PlayerPos = [[-3,-38.6], [73,-33], [115,15], [73,60], [-3,77], [-75.5,60], [-115,15], [-75,-31]]
    private _6PlayerPos = [[-3,-38.6], [73,-33], [73,60], [-3,77], [-75.5,60], [-75,-31]]
    private _4PlayerPos = [[-75,-31], [73,-33], [77,73], [-71,70]]
    private _3PlayerPos = [[-75,-31], [73,-33], [77,73]]
    private _2PlayerPos = [[-75,-31], [77,73]]   


    onLoad() {

    }

    public hideSelf(isHide)
    {
        this.node.active = !isHide
    }

    public setTabelIndex(index: number) {
        this._index = index;
    }

    public getTabelIndex() {
        return this._index;
    }

    public getUniqueId()
    {
        if(!this.node.active) // 隐藏的桌子不参与比较
            return -1
        if (this._roomInfo.tableId>0)
            return this._roomInfo.tableId
        else
            return this._roomInfo.templateId
    }

    public setGameType(type: GameConstValue.GAME_TYPE, roomInfo) {
        this._roomInfo = roomInfo;
        var curRound = roomInfo.roomCurRound
        var gameName = GameConstValue.GAME_NAME[type]
        this._type = 1
        var clubData = GameDataManager.getInstance().clubData;
        var templateInfo = clubData.getTemplateInfoById(this._roomInfo.templateId)
        var desc = gameName
        this.node.getChildByName("btn_detail").y = -75
        // if (type == GameConstValue.GAME_TYPE.NN || type == GameConstValue.GAME_TYPE.ZJH)
        //     this.node.getChildByName("btn_detail").y = -75
        if (templateInfo != null)
        {
            this._curRule = JSON.parse(templateInfo.template.rule);
            this._roomInfo.rule = templateInfo.template.rule
            if (type == GameConstValue.GAME_TYPE.MHXL) {
                let jushu = [8, 16];
                var temp = [4,3,2]
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.LFMJ) {
                let jushu = [8, 16];
                var temp = [3,2]
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (Utils.isXzmj(type))
            {
                let jushu = [4, 8, 16];
                this._playerNum = 4;
                if (type == GameConstValue.GAME_TYPE.SR2F)
                    this._playerNum = 3;
                else if (type == GameConstValue.GAME_TYPE.TR3F || type == GameConstValue.GAME_TYPE.TR2F || type == GameConstValue.GAME_TYPE.TR1F)
                    this._playerNum = 2;
                else if (type == GameConstValue.GAME_TYPE.YJMJ)
                {
                    var temp = [4,3,2]
                    this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                }
                else if (type == GameConstValue.GAME_TYPE.ZGMJ)
                {
                    jushu = [4, 6,10,16];
                    var temp = [3,2]
                    this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                }
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.LRPDK)
            {
                this._type = 0
                let jushu = [8, 12, 20];
                this._playerNum = 2;
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.SCPDK)
            {
                this._type = 2
                let jushu = [8, 12, 20];
                var temp = [4,3,2]
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.PDK || type == GameConstValue.GAME_TYPE.DDZ)
            {
                var temp = [3,2]
                this._type = 0
                let jushu = [8, 12, 20];
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.ZJH)
            {
                var temp = [6,8]
                this._type = 2
                let jushu = [8, 12, 16, 20];
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.NN)
            {
                var temp = [6,8]
                this._type = 2
                let jushu = [8, 12, 16, 20];
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            else if (type == GameConstValue.GAME_TYPE.ZGCP)
            {
                let jushu = [4,6,8,10];
                var temp = [3,2]
                this._playerNum = temp[this._curRule["room"]["player_count_option"]];
                this._ruleJuShu = jushu[this._curRule.round.option];
            }
            desc = templateInfo.template.description
        }
        else
        {
            this._roomInfo.rule = null
            this._ruleJuShu = 8
            if (Utils.isXzmj(type))
            {
                this._playerNum = 4;
                if (type == GameConstValue.GAME_TYPE.SR2F)
                    this._playerNum = 3;
                else if (type == GameConstValue.GAME_TYPE.TR3F || type == GameConstValue.GAME_TYPE.TR2F || type == GameConstValue.GAME_TYPE.TR1F)
                    this._playerNum = 2;
                else if (type == GameConstValue.GAME_TYPE.YJMJ)
                {
                    var temp = [4,3,2]
                    this._playerNum = 4;
                }
                else if (type == GameConstValue.GAME_TYPE.ZGMJ)
                {
                    var temp = [3,2]
                    this._playerNum = 3;
                }
            }
            else if (type == GameConstValue.GAME_TYPE.MHXL)
                this._playerNum = 4;
            else if (type == GameConstValue.GAME_TYPE.LRPDK)
            {
                this._type = 0
                this._playerNum = 2;
            }
            else if (type == GameConstValue.GAME_TYPE.PDK || type == GameConstValue.GAME_TYPE.DDZ)
            {
                this._type = 0
                this._playerNum = 3;
            }
            else if (type == GameConstValue.GAME_TYPE.ZJH)
            {
                this._type = 2
                this._playerNum = 8;
                this._ruleJuShu = 16
            }
            else if (type == GameConstValue.GAME_TYPE.NN)
            {
                this._type = 2
                this._playerNum = 8;
                this._ruleJuShu = 16
            }
            else if (type == GameConstValue.GAME_TYPE.SCPDK)
            {
                this._type = 2
                this._playerNum = 4
            }
            else if (type == GameConstValue.GAME_TYPE.ZGCP)
            {
                var temp = [3,2]
                this._playerNum = 3;
            }
        }

        if (curRound >= 0){
            let cr: string = curRound.toString();
            let ar: string = this._ruleJuShu.toString() ;
            this.labelTitle.string = desc
            this.labelRound.string = cr + "/" + ar
        }
        else if(this._ruleJuShu >= 0)
        {
            this.labelTitle.string = desc;
            this.labelRound.string = 0 + "/" + this._ruleJuShu.toString()
        }
    }


    public setState(isstart: boolean) {
        return 
        // this.node.getChildByName("sp_wait").active = !isstart
        // this.node.getChildByName("sp_playing").active = isstart
    }

    public setPlayer(player: any[]) {
        if (this._roomInfo.tableId < 0)
            return
        var posList = this._4PlayerPos
        var scale = 0.55
        if (this._playerNum == 3)
            posList = this._3PlayerPos
        else if (this._playerNum == 2)
            posList = this._2PlayerPos
        else if (this._playerNum == 8)
        {
            scale = 0.4
            posList = this._8PlayerPos
        }
        else if (this._playerNum == 6)
        {
            scale = 0.4
            posList = this._6PlayerPos
        }
        for (let i = 0; i < 8; ++i) {
            if(i < this._playerNum)
                this.node.getChildByName("player"+i).position = cc.v3(posList[i][0], posList[i][1])
            if (i < player.length)
            {
                this.node.getChildByName("player"+i).active = true
                this.node.getChildByName("player"+i).scale = scale
                Utils.loadTextureFromNet(this.spPlayerHead[i], player[i].playerInfo.icon);
                if (i < 4)
                    this.node.getChildByName("player"+i).getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(player[i].playerInfo.nickname, 5)
                this.setPlayerOnline(i, player[i].online)
            }
            else
            {
                this.node.getChildByName("player"+i).active = false // 默认头像
            }
        }
        if (this._type == 2)
            this.node.getChildByName("table").getComponent(cc.Sprite).spriteFrame = this.spfBG[0]
        else
            this.node.getChildByName("table").getComponent(cc.Sprite).spriteFrame = this.spfBG[this._playerNum+this._type*3-2]

    }
    
    private setPlayerOnline(seat, online) {
        this.node.getChildByName("player"+seat).getChildByName("online").active = !online
    }

    private button_select() {
        var clubData = GameDataManager.getInstance().clubData;
        if (this._roomInfo.roomCurRound >= 0) {
            if (clubData.isBigBossOfUnion() || (clubData.clubType == 0 && clubData.roleType >= CLUB_POWER.CRT_ADMIN)) {
                //管理员权限的
                UIManager.getInstance().openUI(ClubTableInfoUI, 1, () => {
                    UIManager.getInstance().getUI(ClubTableInfoUI).getComponent("ClubTableInfoUI").initUI(this._roomInfo);
                });
                return;
            }
            let joinInfo =
            {
                tableId: this._roomInfo.tableId,
                clubId: clubData.curSelectClubId,
                gameType: this._roomInfo.gameType,
                templateId: this._roomInfo.templateId,
            }
            UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
                UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(this._roomInfo,clubData.clubType, joinInfo);
            });
        }
        else
        {
            if (GameDataManager.getInstance().isCreatingRoom){
                GameManager.getInstance().openWeakTipsUI("房间创建中，请稍后");
                return
            }
            var rule = JSON.parse(this._roomInfo.rule) 
            if (rule.option.gps_distance > 0){
                if (!Utils.checkGps())
                    return
            }
            let msg =
            {
                clubId: clubData.curSelectClubId,
                templateId: this._roomInfo.templateId,
            }
            
            GameDataManager.getInstance().isCreatingRoom = true
            PreferentData.getInstance().updateEnterGamePreferent(this._roomInfo.templateId)
            MessageManager.getInstance().messageSend(Proto.CS_CreateRoom.MsgID.ID, msg);
        }
    }

    private button_detail()
    {
        var clubData = GameDataManager.getInstance().clubData;
        if (this._roomInfo.roomCurRound >= 0) {
            if (clubData.isBigBossOfUnion() || (clubData.clubType == 0 && clubData.roleType >= CLUB_POWER.CRT_ADMIN)) {
                //管理员权限的
                UIManager.getInstance().openUI(ClubTableInfoUI, 1, () => {
                    UIManager.getInstance().getUI(ClubTableInfoUI).getComponent("ClubTableInfoUI").initUI(this._roomInfo);
                });
                return;
            }
            let joinInfo =
            {
                tableId: this._roomInfo.tableId,
                clubId: clubData.curSelectClubId,
                gameType: this._roomInfo.gameType,
                templateId: this._roomInfo.templateId,
            }
            UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
                UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(this._roomInfo,clubData.clubType, joinInfo);
            });
        }
        else
        {
            let info =
            {
                rule: this._roomInfo.rule,
                gameType: this._roomInfo.gameType,
                templateId: this._roomInfo.templateId,
            }
            UIManager.getInstance().openUI(ShowRuleUI, 5, () => {
                UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
            })
        }
    }



}

