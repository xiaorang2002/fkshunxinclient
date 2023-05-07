import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import * as Proto from "../../../../proto/proto-min";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_MHXL extends BaseRuleUI {
    protected static className = "RuleUI_MHXL";

    private gpsList = [100,300,500,1000]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        wf1: [true, false, false],  // 四人局 三人局 二人局
        wf2: [false, false, false, false, false, false], // 打一张可报听 报听可闷
        ji1: [true, false], // 翻牌鸡 摇摆鸡
        ji2: [false, false, false, false], // 本鸡， 乌骨鸡， 星期鸡， 吹风鸡
        zhuang: [true, false], // 一扣二 连庄
        gn: [false, false, true, false],// ip防作弊 gps防作弊 手动准备
        tg1: [true, false, false, false], // 不托管，30秒，60秒，120秒
        gps_distance: -1,
    }

    @property(cc.Label)
    gps_str: cc.Label = null;

    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];

    //玩法1
    @property([cc.Toggle])
    toggle_wf_1: cc.Toggle[] = [];

    //玩法2
    @property([cc.Toggle])
    toggle_wf_2: cc.Toggle[] = [];

    //可选鸡1
    @property([cc.Toggle])
    toggle_ji_1: cc.Toggle[] = [];

    //可选鸡2
    @property([cc.Toggle])
    toggle_ji_2: cc.Toggle[] = [];

    //庄
    @property([cc.Toggle])
    toggle_zhuang: cc.Toggle[] = [];

    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];

    //托管1
    @property([cc.Toggle])
    toggle_tg_1: cc.Toggle[] = [];

    start()
    {

    }

    public initRule(ruleInfo: any = null) {
        this.isInit = true;
        this.initRuleInfoByData(ruleInfo)
        this.updateView();
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    private initRuleInfoByData(ruleInfo)
    {
        if (ruleInfo)
        {
            var oRule = ruleInfo
            this.ruleInfo.ju_shu = oRule.round.option
            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[oRule.pay.option - 1] = true
            this.ruleInfo.wf1[0] = false
            this.ruleInfo.wf1[oRule.room.player_count_option] = true
            this.ruleInfo.wf2[0] = oRule.play.yi_zhang_bao_ting
            this.ruleInfo.wf2[1] = oRule.play.bao_ting_ke_men
            this.ruleInfo.wf2[2] = oRule.play.dai_zhong
            this.ruleInfo.wf2[3] = oRule.play.gu_mai
            this.ruleInfo.wf2[4] = oRule.play.xiao_hu_men
            this.ruleInfo.wf2[5] = oRule.play.hu_tips
            this.ruleInfo.ji1[0] = oRule.play.fan_pai_ji
            this.ruleInfo.ji1[1] = oRule.play.yao_bai_ji
            this.ruleInfo.ji2[0] = oRule.play.ben_ji
            this.ruleInfo.ji2[1] = oRule.play.wu_gu_ji
            this.ruleInfo.ji2[2] = oRule.play.xing_qi_ji
            this.ruleInfo.ji2[3] = oRule.play.chui_feng_ji
            this.ruleInfo.zhuang[0] = oRule.play.yi_kou_er
            this.ruleInfo.zhuang[1] = oRule.play.lian_zhuang

            this.ruleInfo.gn[0] = oRule.option.ip_stop_cheat
            this.ruleInfo.gn[2] = oRule.option.hand_ready
            this.ruleInfo.gn[3] = oRule.option.block_hu_dong
            if (oRule.trustee.second_opt >= 0)
            {
                this.ruleInfo.tg1[0] = false
                this.ruleInfo.tg1[oRule.trustee.second_opt+1] = true
            }
            if (oRule.option.gps_distance > 0){
                this.ruleInfo.gn[1] = true
                this.ruleInfo.gps_distance = oRule.option.gps_distance
            }
        }
        else
        {
            let save_rule_mhxl = cc.sys.localStorage.getItem("rule_mhxl");
            if (save_rule_mhxl != null) {
                this.ruleInfo = JSON.parse(save_rule_mhxl);
                cc.sys.localStorage.removeItem("rule_mhxl");
            }
        }
    }

    public setRuleType(type)
    {
        var clubData = GameDataManager.getInstance().clubData
        if (clubData != null)
        {
            this.ruleInfo.zf[1] = true
            this.ruleInfo.zf[0] = false
            this.toggle_zf[0].node.active = false
            this.toggle_zf[1].node.position = this.toggle_zf[0].node.position
        }
        if (type == 0){
            this.toggle_zf[1].node.active = false
            this.toggle_zf[2].node.active = true
            this.toggle_zf[0].node.active = false
            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[1] = false
            this.ruleInfo.zf[2] = true
            this.toggle_zf[2].node.position = this.toggle_zf[0].node.position
        }
        else{
            this.toggle_zf[2].node.active = false 
            this.toggle_zf[1].node.active = true
        }
        this.toggle_zf[this.ruleInfo.zf.indexOf(true)].check();
        this.ruleSelect(this.toggle_zf[this.ruleInfo.zf.indexOf(true)], true, false);
    }

    public updateView() {
        this.toggle_jushu[this.ruleInfo.ju_shu].check();
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);

        this.toggle_wf_1[this.ruleInfo.wf1.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_1[this.ruleInfo.wf1.indexOf(true)], true);

        for (let idx = 0;idx<this.ruleInfo.wf2.length;idx++)
        {  
            if (this.ruleInfo.wf2[idx]){
                this.toggle_wf_2[idx].check();
                this.ruleSelect(this.toggle_wf_2[idx], true);
                this.ruleInfo.wf2[idx] = true
            }
        }

        this.toggle_ji_1[this.ruleInfo.ji1.indexOf(true)].check();
        this.ruleSelect(this.toggle_ji_1[this.ruleInfo.ji1.indexOf(true)], true);

        for (let idx = 0;idx<this.ruleInfo.ji2.length;idx++)
        {  
            if (this.ruleInfo.ji2[idx]){
                this.toggle_ji_2[idx].check();
                this.ruleSelect(this.toggle_ji_2[idx], true);
                this.ruleInfo.ji2[idx] = true
            }
        }

        this.toggle_zhuang[this.ruleInfo.zhuang.indexOf(true)].check();
        this.ruleSelect(this.toggle_zhuang[this.ruleInfo.zhuang.indexOf(true)], true);
        this.toggle_wf_2[2].node.active = this.ruleInfo.wf1.indexOf(true) == 0

        for (var idx in this.ruleInfo.gn)
        {  
            if (this.ruleInfo.gn[idx]){
                this.toggle_gn[idx].check();
                this.ruleSelect(this.toggle_gn[idx], true);
                this.ruleInfo.gn[idx] = true
            }
        }
        this.toggle_tg_1[this.ruleInfo.tg1.indexOf(true)].check();
        this.ruleSelect(this.toggle_tg_1[this.ruleInfo.tg1.indexOf(true)], true);

        if (this.ruleInfo.gps_distance > 0)
            this.gps_str.string = this.ruleInfo.gps_distance.toString()
        else
            this.gps_str.string = "0"

        this.node.setContentSize(936, 1100);
        this.isInit = false;
        
    }

    public getRule()
    {
        var isDaiZhong = this.ruleInfo.wf1.indexOf(true) == 0 &&  this.ruleInfo.wf2[2]
        var trustee = {}
        if (this.ruleInfo.tg1.indexOf(true) != 0)
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1}
        var gps  =this.ruleInfo.gps_distance
        if (!this.ruleInfo.gn[1])
            gps = -1
        var rule = {
            round: {option:this.ruleInfo.ju_shu},
            pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1, type_opt:0},
            room: {player_count_option: this.ruleInfo.wf1.indexOf(true)},
            play: { yi_zhang_bao_ting: this.ruleInfo.wf2[0], // 打一张可报听
                bao_ting_ke_men: this.ruleInfo.wf2[1], // 报听可闷
                dai_zhong: isDaiZhong, // 带红中
                gu_mai: this.ruleInfo.wf2[3], // 估卖
                xiao_hu_men: this.ruleInfo.wf2[4], // 小胡必闷
                hu_tips: this.ruleInfo.wf2[5],
                fan_pai_ji: this.ruleInfo.ji1[0], // 翻牌鸡
                yao_bai_ji: this.ruleInfo.ji1[1], // 摇摆鸡
                ben_ji: this.ruleInfo.ji2[0], // 本鸡
                wu_gu_ji: this.ruleInfo.ji2[1], // 乌骨鸡
                xing_qi_ji: this.ruleInfo.ji2[2],// 星期鸡
                chui_feng_ji: this.ruleInfo.ji2[3],// 吹风鸡
                yi_kou_er: this.ruleInfo.zhuang[0], // 一扣二
                lian_zhuang: this.ruleInfo.zhuang[1],// 连庄
            },
            option:{
                ip_stop_cheat: this.ruleInfo.gn[0],
                hand_ready:this.ruleInfo.gn[2],     
                block_hu_dong:this.ruleInfo.gn[3],     
                gps_distance:gps         

            },
            trustee:trustee,
        }
        return rule
    }

    public getCostInfo()
    {   
        if (this.ruleInfo.ju_shu == 0)
            return 1
        else
            return 2
    }

    public saveRule()
    {
        cc.sys.localStorage.setItem("rule_mhxl", JSON.stringify(this.ruleInfo));
    }

    public setAllGrey()
    {
        return
        this.node.getChildByName("pingbi").active = true
        for (var idx = 0; idx < this.toggle_jushu.length; idx++)
            this.toggle_jushu[idx].interactable = false
        for (var idx = 0; idx < this.toggle_zf.length; idx++)
            this.toggle_zf[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_1.length; idx++)
            this.toggle_wf_1[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_2.length; idx++)
            this.toggle_wf_2[idx].interactable = false
        for (var idx = 0; idx < this.toggle_ji_1.length; idx++)
            this.toggle_ji_1[idx].interactable = false
        for (var idx = 0; idx < this.toggle_ji_2.length; idx++)
            this.toggle_ji_2[idx].interactable = false
        for (var idx = 0; idx < this.toggle_gn.length; idx++)
            this.toggle_gn[idx].interactable = false
        for (var idx = 0; idx < this.toggle_zhuang.length; idx++)
            this.toggle_zhuang[idx].interactable = false
        for (var idx = 0; idx < this.toggle_tg_1.length; idx++)
            this.toggle_tg_1[idx].interactable = false
    }

    public btn_gps_length(event, customEventData)
    {
        if (!this.ruleInfo.gn[1])
        {
            return
        }
        var type = parseInt(customEventData)
        var length = parseFloat(this.gps_str.string)
        var idx = this.gpsList.indexOf(length)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.gpsList.length - 1)
                idx = this.gpsList.length - 1
        }
        this.ruleInfo.gps_distance = this.gpsList[idx]
        this.gps_str.string = this.gpsList[idx].toString();

    }

    public btn_jushu(event, customEventData)
    {
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], false);
        this.ruleInfo.ju_shu = parseInt(customEventData);
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    public btn_wanfa1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf1.indexOf(true)
        this.ruleSelect(this.toggle_wf_1[originSelectIndex], false);
        this.ruleInfo.wf1[originSelectIndex] =false
        this.ruleInfo.wf1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_1[parseInt(customEventData)], true);
        this.toggle_wf_2[2].node.active = this.ruleInfo.wf1.indexOf(true) == 0
    }

    public btn_wanfa2(event, customEventData)
    {
        this.ruleInfo.wf2[parseInt(customEventData)] = !this.ruleInfo.wf2[parseInt(customEventData)]
        this.ruleSelect(this.toggle_wf_2[parseInt(customEventData)], this.ruleInfo.wf2[parseInt(customEventData)]);
         
    }

    public btn_ji1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ji1.indexOf(true)
        this.ruleSelect(this.toggle_ji_1[originSelectIndex], false);
        this.ruleInfo.ji1[originSelectIndex] =false
        this.ruleInfo.ji1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_ji_1[parseInt(customEventData)], true);
    }

    public btn_ji2(event, customEventData)
    {
        this.ruleInfo.ji2[parseInt(customEventData)] = !this.ruleInfo.ji2[parseInt(customEventData)]
        this.ruleSelect(this.toggle_ji_2[parseInt(customEventData)], this.ruleInfo.ji2[parseInt(customEventData)]);
    }

    public btn_zhuang(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zhuang.indexOf(true)
        this.ruleSelect(this.toggle_zhuang[originSelectIndex], false);
        this.ruleInfo.zhuang[originSelectIndex] =false
        this.ruleInfo.zhuang[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zhuang[parseInt(customEventData)], true);
    }

    public btn_gn(event, customEventData)
    {
        this.ruleInfo.gn[parseInt(customEventData)] = !this.ruleInfo.gn[parseInt(customEventData)]
        this.ruleSelect(this.toggle_gn[parseInt(customEventData)], this.ruleInfo.gn[parseInt(customEventData)]);
    }

    public btn_tg1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.tg1.indexOf(true)
        this.ruleSelect(this.toggle_tg_1[originSelectIndex], false);
        this.ruleInfo.tg1[originSelectIndex] =false
        this.ruleInfo.tg1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_tg_1[parseInt(customEventData)], true);
    }
}
