import { UnionUI_Record } from './../union/UnionUI_Record';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { CLUB_POWER } from './../../../data/club/ClubData';
import { ClubUI } from './../../ClubUI';
import * as Proto from "../../../../proto/proto-min";
import { GameManager } from './../../../GameManager';
import { ClubRecordUI } from './ClubRecordUI';
import { BaseUI, UIClass } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import { Utils } from "../../../../framework/Utils/Utils";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import MjGameOver_UI from "../mj/MjGameOver_UI";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubRecordItem extends cc.Component {

    @property(cc.Label)
    labelGameType: cc.Label = null;
    @property(cc.Label)
    labelRoomId: cc.Label = null;
    @property(cc.Label)
    labelTime: cc.Label = null;
    @property([cc.SpriteFrame])
    spfBg: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spBg: cc.SpriteFrame = null;

    private curRecordIndex = 0      //当前战绩下标，存在战绩主界面
    private game_id = 0
    private round_id = 0
    private game_rule = null
    private table_name = ""

    // private _playbackId: number = 0;
    // private _moreInfo: any = null;
    // private _gameType: number = 0;
    private gameUIUrl: UIClass<BaseUI>[] = [,
        MjGameOver_UI,
    ];

    onLoad() {

    }

    updateView(idx, info, type, rule, tableName)
    {
        try{
            if (type == "round_type") // 请求的是小局
            {
                this.game_id = info.game_id
                this.curRecordIndex = idx
                var detail = JSON.parse(info.log)
                this.node.getChildByName("label_room_id").getComponent(cc.Label).string = "房间号：" + info.table_id;
                var curRule = null
                if (rule)
                    curRule = JSON.parse(rule)
                if(detail.rule)
                    curRule = detail.rule
                this.setRound(detail.rule, detail.cur_round)
                this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.formatDate(info.start_time, 1);
                if (tableName != "")
                    this.setTableName(tableName)
                else
                    this.setGameType(info.game_id)
                for(var i =0; i< detail.players.length; i++)
                {
                    this.updatePlayer(i, detail.players[i],type)
                }
            }
            else  // 是大局
            {
                if (info.description)
                    this.setTableName(info.description)
                else if (info.game_id != null)
                    this.setGameType(info.game_id)
                this.round_id = info.round
                this.game_rule = info.rule
                this.table_name = this.labelGameType.string
                var biggestScore = 0
                var playerScoreMap = new Map<number, number>()
                var dismissReason = ""
                if (info.log.dismissreason)
                    dismissReason =  "（"+ Utils.getRecordDismissReason(info.log.dismissreason) + "）"
                this.node.getChildByName("btn_playback").active = false
                this.node.getChildByName("btn_detail").active = true
                this.node.getChildByName("sp_bg").getComponent(cc.Sprite).spriteFrame = this.spBg
                this.node.getChildByName("label_room_id").getComponent(cc.Label).string = "局号：" + info.round.slice(24,-1) + dismissReason;
                this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.formatDate(info.start_time, 1);
                for(var i =0; i< info.players.length; i++)
                {
                    if (i > 7)
                        continue
                    this.updatePlayer(i, info.players[i],type)
                    if (info.log)
                    {
                        var score = info.log.balance[info.players[i].guid] /100
                        var fuhao = ""
                        if (score > biggestScore)
                            biggestScore = score
                        if (score < 0)
                            var color = new cc.Color(89,146,68)
                        else
                        {
                            var color = new cc.Color(219,110,30)
                            fuhao = "+"
                        }
                        this.node.getChildByName("player" + i).getChildByName("label_total_score").getComponent(cc.Label).string = fuhao +score
                        this.node.getChildByName("player" + i).getChildByName("label_total_score").color = color
                        playerScoreMap.set(i, score)
                    }
                    else
                    {
                        this.node.getChildByName("player" + i).getChildByName("label_total_score").getComponent(cc.Label).string = ""
                    }
                }
                playerScoreMap.forEach((tempScore, idx)=>{
                    if (biggestScore == tempScore && biggestScore != 0)
                        this.node.getChildByName("player" + idx).getChildByName("big_win").active = true
                })
            }
        }
        catch (e){
            console.log(e)
        }
        
    }

    //设置局数
    private setRound(rule, curRound) {
        var list = [8, 16];
        if(this.game_id == GameConstValue.GAME_TYPE.ZGMJ){
            list = [4,6,10,16]
        }
        else if(this.game_id == GameConstValue.GAME_TYPE.ZGCP){
            list = [4,6,8,10]
        }
        else if (Utils.isXzmj(this.game_id)){
            list = [4, 8, 16]
        }
        else if (this.game_id == GameConstValue.GAME_TYPE.PDK || this.game_id == GameConstValue.GAME_TYPE.LRPDK || this.game_id == GameConstValue.GAME_TYPE.SCPDK 
            || this.game_id == GameConstValue.GAME_TYPE.DDZ)
            list = [8, 12, 20]
        var ruleJuShu = list[rule.round.option];
        this.node.getChildByName("label_round").getComponent(cc.Label).string = "局数：" + curRound + "/" +ruleJuShu;
    }

    //设置房间类型
    setGameType(type) {
        this.labelGameType.string = GameConstValue.GAME_NAME[type];
    }

    setTableName(tableName)
    {
        this.labelGameType.string = tableName
    }

    //设置玩家数组
    updatePlayer(index, info, type) {
        try{
            if (index > 7)
                return;
            var playerNode = this.node.getChildByName("player" + index)
            playerNode.active = true;
            var headsp = playerNode.getChildByName("sp_mask").getChildByName("sp_head").getComponent(cc.Sprite);
            Utils.loadTextureFromNet(headsp, info.head_url);
            playerNode.getChildByName("label_name").getComponent(cc.Label).string = Utils.getShortName(info.nickname);
            playerNode.getChildByName("label_id").getComponent(cc.Label).string = info.guid
            playerNode.getChildByName("big_win").active = false
            if (info.guid == GameDataManager.getInstance().userInfoData.userId)
                playerNode.getChildByName("sp_bg").getComponent(cc.Sprite).spriteFrame = this.spfBg[0];
            else
                playerNode.getChildByName("sp_bg").getComponent(cc.Sprite).spriteFrame = this.spfBg[1];
            if (type == "round_type")
            {
                var fuhao = ""
                if (info.score < 0)
                    playerNode.getChildByName("label_total_score").color = new cc.Color(89,146,68)
                else
                {
                    playerNode.getChildByName("label_total_score").color = new cc.Color(219,110,30)
                    fuhao = "+"
                }
                // if (info.score < 0)
                //     playerNode.getChildByName("label_round_score").color = new cc.Color(104,132,173)
                // else
                //     playerNode.getChildByName("label_round_score").color = new cc.Color(236,128,53)
                //设置单局分数s
                if (this.game_id == GameConstValue.GAME_TYPE.PDK || this.game_id == GameConstValue.GAME_TYPE.LRPDK || this.game_id == GameConstValue.GAME_TYPE.DDZ 
                    || this.game_id == GameConstValue.GAME_TYPE.SCPDK)
                    playerNode.getChildByName("label_total_score").getComponent(cc.Label).string = fuhao + info.round_money/100;
                else
                    playerNode.getChildByName("label_total_score").getComponent(cc.Label).string = fuhao + info.win_money/100;
                //设置总分数
                // playerNode.getChildByName("label_total_score").getComponent(cc.Label).string = "总分：" + info.total_money/100;
               
            }
            else
            {
                playerNode.getChildByName("label_round_score").active = false
            }
            
        }
        catch (e){
            console.log(e)
        }

        
    }

    // //设置详情
    // setMore(info) {
    //     this._moreInfo = info;
    // }

    //回放按钮
    button_play_back(event) {
        AudioManager.getInstance().playSFX("button_click");
        if ((this.game_id >= GameConstValue.GAME_TYPE.MHXL && this.game_id <= GameConstValue.GAME_TYPE.ZGMJ) || this.game_id == GameConstValue.GAME_TYPE.ZGCP)
        {
            if (UIManager.getInstance().getUI(ClubRecordUI))
                UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").resPlayBack(this.game_id, this.curRecordIndex);
            else if (UIManager.getInstance().getUI(UnionUI_Record))
                UIManager.getInstance().getUI(UnionUI_Record).getComponent("UnionUI_Record").resPlayBack(this.game_id, this.curRecordIndex);
        }
        else
            GameManager.getInstance().openWeakTipsUI("战绩回放功能制作中");           
    }

    button_detail()
    {
        AudioManager.getInstance().playSFX("button_click");
        if (this.round_id == 0)
            return
        if (UIManager.getInstance().getUI(ClubRecordUI))
            UIManager.getInstance().getUI(ClubRecordUI).getComponent("ClubRecordUI").queryRoudData(this.round_id, this.game_rule, this.table_name)
        else if (UIManager.getInstance().getUI(UnionUI_Record))
            UIManager.getInstance().getUI(UnionUI_Record).getComponent("UnionUI_Record").queryRoudData(this.round_id, this.game_rule, this.table_name)
    }

    button_member_info(event, customEventData)
    {
        var clubData = GameDataManager.getInstance().clubData
        var idx = parseInt(customEventData)
        var guid = this.node.getChildByName("player" + idx).getChildByName("label_id").getComponent(cc.Label).string
        if (UIManager.getInstance().getUI(ClubUI) && clubData && clubData.roleType >= CLUB_POWER.CRT_PRATNER && guid.length != 0 && clubData.clubType != 0)
        {
            AudioManager.getInstance().playSFX("button_click");
            MessageManager.getInstance().messageSend(Proto.CS_CLUB_MEMBER_INFO.MsgID.ID, {
                guid: parseInt(guid),
                clubId: clubData.curSelectClubId,
            })
        }
    }

}

