import { UIManager } from './../../../../framework/Manager/UIManager';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GameManager } from './../../../GameManager';
import { MessageManager } from './../../../../framework/Manager/MessageManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { LogWrap } from './../../../../framework/Utils/LogWrap';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import * as Proto from "../../../../proto/proto-min";

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubInfoUI extends BaseUI {

    protected static className = "ClubInfoUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }
    
    private settingInfo = {
        jztz: [true, false, false, false],  // 禁止同桌设置
        jingjie: [false, false],
        pinbi: [false, false],
        adminAnalysis: false,
        autoConvert:false,
        convertTime:0,
        allowSearchRecordNoLimit:false,
    }

    private yjConvertList = [10,30,60,180,360,720,1440]

    @property([cc.Toggle])
    toggle_jztz: cc.Toggle[] = [];

    @property([cc.Toggle])
    toggle_jingjie: cc.Toggle[] = [];
    
    @property([cc.Toggle])
    toggle_pinbi: cc.Toggle[] = [];

    @property(cc.Node)
    setting_jztz: cc.Node = null;

    @property(cc.Node)
    setting_jinjie: cc.Node = null;

    @property(cc.Node)
    setting_admin: cc.Node = null;

    @property(cc.Node)
    setting_pinbi: cc.Node = null;

    @property(cc.Node)
    setting_convert: cc.Node = null;

    @property(cc.Node)
    setting_record: cc.Node = null;

    @property(cc.Label)
    label_convert: cc.Label = null;

    start() {
        ListenerManager.getInstance().add(Proto.S2C_CLUB_GET_CONFIG.MsgID.ID, this, this.onConfigRec);
        ListenerManager.getInstance().add(Proto.S2C_CLUB_EDIT_CONFIG.MsgID.ID, this, this.onConfigRec1);
        var clubData = GameDataManager.getInstance().clubData
        this.setting_jztz.active = clubData.clubType != 0;
        this.setting_jinjie.active = clubData.clubType != 0;
        this.setting_admin.active = clubData.clubType == 0;
        this.setting_pinbi.active = clubData.clubType != 0;
        this.setting_convert.active = clubData.clubType != 0;
        this.setting_record.active = clubData.clubType != 0;

        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_GET_CONFIG.MsgID.ID, { clubId: clubData.curSelectClubId});

    }

    onConfigRec1(msg)
    {
        GameManager.getInstance().openWeakTipsUI("操作成功");
        this.onConfigRec(msg)
    }

    onConfigRec(msg)
    {
        this.settingInfo.jztz[0] = false
        if (msg.conf != "" && msg.conf != "{}")
        {
            var oMsg = JSON.parse(msg.conf)
            if (oMsg.block_partner_player)
                this.settingInfo.jztz[1] = oMsg.block_partner_player
            else if (oMsg.block_partner_player_branch)
                this.settingInfo.jztz[2] = oMsg.block_partner_player_branch
            else if (oMsg.block_partner_player_2_layer)
                this.settingInfo.jztz[3] = oMsg.block_partner_player_2_layer
            if (oMsg.credit_block_score)
                this.settingInfo.jingjie[0] = oMsg.credit_block_score
            if (oMsg.credit_block_play)
                this.settingInfo.jingjie[1] = oMsg.credit_block_play
            if (oMsg.admin_analysis)
                this.settingInfo.adminAnalysis = oMsg.admin_analysis
            if (oMsg.limit_online_player_num == true || oMsg.limit_online_player_num == "true")
                this.settingInfo.pinbi[0] = true
            else
                this.settingInfo.pinbi[0] = false
            if (oMsg.limit_table_num == true || oMsg.limit_table_num == "true")
                this.settingInfo.pinbi[1] = true
            else
                this.settingInfo.pinbi[1] = false
            if (oMsg.allow_search_record_no_limit == true || oMsg.allow_search_record_no_limit == "true" || oMsg.limit_table_num == "true")
                this.settingInfo.allowSearchRecordNoLimit = true
            else
                this.settingInfo.allowSearchRecordNoLimit = false
               
            if (oMsg.auto_cash_commission)
            {
                this.settingInfo.convertTime = oMsg.auto_cash_commission.interval/60
                this.settingInfo.autoConvert = oMsg.auto_cash_commission.open
            }
        }
        if (this.settingInfo.jztz.indexOf(true) < 0)
        {
            this.settingInfo.jztz[0] = true
        }
        this.toggle_jztz[this.settingInfo.jztz.indexOf(true)].check();
        for (let idx =0;idx<this.settingInfo.jingjie.length;idx++)
        {  
            if (this.settingInfo.jingjie[idx]){
                this.toggle_jingjie[idx].check();
                this.settingInfo.jingjie[idx] = true
            }
        }
        for (let idx;idx<this.settingInfo.pinbi.length;idx++)
        {  
            if (this.settingInfo.pinbi[idx]){
                this.toggle_pinbi[idx].check();
                this.settingInfo.pinbi[idx] = true
            }
        }
        this.node.getChildByName("setting_admin").getChildByName("checkmark").active = this.settingInfo.adminAnalysis
        this.setting_convert.getChildByName("checkmark").active = this.settingInfo.convertTime != 0
        this.setting_record.getChildByName("checkmark").active = this.settingInfo.allowSearchRecordNoLimit
        this.label_convert.string = this.settingInfo.convertTime.toString()
        MessageManager.getInstance().disposeMsg();
    }

    public btn_jztz(event, customEventData)
    {
        var originSelectIndex = this.settingInfo.jztz.indexOf(true)
        this.settingInfo.jztz[originSelectIndex] =false
        this.settingInfo.jztz[parseInt(customEventData)] = true;
    }

    public btn_jingjie(event, customEventData)
    {
        this.settingInfo.jingjie[parseInt(customEventData)] = !this.settingInfo.jingjie[parseInt(customEventData)]
    }

    public btn_pinbi(event, customEventData)
    {
        this.settingInfo.pinbi[parseInt(customEventData)] = !this.settingInfo.pinbi[parseInt(customEventData)]
    }

    public btn_admin(event, customEventData)
    {
        this.settingInfo.adminAnalysis = !this.settingInfo.adminAnalysis
        this.node.getChildByName("setting_admin").getChildByName("checkmark").active = this.settingInfo.adminAnalysis
    }

    public btn_record(event, customEventData)
    {
        this.settingInfo.allowSearchRecordNoLimit = !this.settingInfo.allowSearchRecordNoLimit
        this.setting_record.getChildByName("checkmark").active = this.settingInfo.allowSearchRecordNoLimit
    }

    public btn_save(){
        AudioManager.getInstance().playSFX("button_click"); 
        var clubData = GameDataManager.getInstance().clubData
        var msg = {
            block_partner_player:this.settingInfo.jztz[1],
            block_partner_player_branch:this.settingInfo.jztz[2],
            block_partner_player_2_layer:this.settingInfo.jztz[3],
            credit_block_score:this.settingInfo.jingjie[0],
            credit_block_play:this.settingInfo.jingjie[1],
            admin_analysis:this.settingInfo.adminAnalysis,
            limit_online_player_num:this.settingInfo.pinbi[0],
            limit_table_num:this.settingInfo.pinbi[1],
            auto_cash_commission:{open: false, interval: 0},
            allow_search_record_no_limit:this.settingInfo.allowSearchRecordNoLimit,
        }
        if (this.settingInfo.autoConvert && parseInt(this.label_convert.string) > 0)
        {
            msg.auto_cash_commission.interval = parseInt(this.label_convert.string)*60
            msg.auto_cash_commission.open = true
        }
        MessageManager.getInstance().messageSend(Proto.C2S_CLUB_EDIT_CONFIG.MsgID.ID, { clubId: clubData.curSelectClubId, conf: JSON.stringify(msg)});
    }

    public btn_convert_change(event, customEventData)
    {
        var type = parseInt(customEventData)
        var length = parseInt(this.label_convert.string)
        var idx = this.yjConvertList.indexOf(length)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.yjConvertList.length - 1)
                idx = this.yjConvertList.length - 1 
        }
        this.settingInfo.convertTime = this.yjConvertList[idx]
        this.label_convert.string = this.yjConvertList[idx].toString();
    }

    public btn_convert_confirm()
    {
        this.settingInfo.autoConvert = !this.settingInfo.autoConvert
        this.setting_convert.getChildByName("checkmark").active = this.settingInfo.autoConvert
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click"); 
        UIManager.getInstance().closeUI(ClubInfoUI);
    }
}
