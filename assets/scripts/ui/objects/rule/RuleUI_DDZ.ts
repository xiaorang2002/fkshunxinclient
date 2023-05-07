import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_DDZ extends BaseRuleUI {
    protected static className = "RuleUI_DDZ";


    private gpsList = [100,300,500,1000]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        fd:[true, false, false], // 16倍，32倍，64倍
        ren: [true, false],  // 三人局 二人局
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        wf1: [true, false],  // 叫地主，叫分
        wf2: [false, false, false, false, false, false, false, false],
        gn: [false, false, true, false, true, true],// ip防作弊 gps防作弊 手动准备 禁止互动 申请解散
        zbcs: [true,false, false, false, false], // 10  15 30 60 90
        tg1: [true, false, false, false], // 不托管，30秒，60秒，120秒
        tg2: [true, false, false, false, false],
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

    //人数
    @property([cc.Toggle])
    toggle_rs: cc.Toggle[] = [];

    //封顶
    @property([cc.Toggle])
    toggle_fd: cc.Toggle[] = [];

    //玩法
    @property([cc.Toggle])
    toggle_wf1: cc.Toggle[] = [];

    //玩法
    @property([cc.Toggle])
    toggle_wf2: cc.Toggle[] = [];

    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];

    //托管1
    @property([cc.Toggle])
    toggle_tg_1: cc.Toggle[] = [];

    //托管2
    @property([cc.Toggle])
    toggle_tg_2: cc.Toggle[] = [];
    
    //准备超时
    @property([cc.Toggle])
    toggle_zbcs: cc.Toggle[] = [];

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
            this.ruleInfo.fd[0] = false
            this.ruleInfo.fd[oRule.play.max_times] = true
            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[oRule.pay.option - 1] = true
            this.ruleInfo.ren[0] = false
            this.ruleInfo.ren[oRule.room.player_count_option] = true
            this.ruleInfo.wf1[0] = oRule.play.call_landlord
            this.ruleInfo.wf1[1] = oRule.play.call_score
            this.ruleInfo.wf2[0] = oRule.play.random_call
            this.ruleInfo.wf2[1] = oRule.play.san_da_must_call
            this.ruleInfo.wf2[2] = oRule.play.si_dai_er
            this.ruleInfo.wf2[3] = oRule.play.san_dai_er
            this.ruleInfo.wf2[4] = oRule.play.san_zhang
            this.ruleInfo.wf2[5] = oRule.room.dismiss_all_agree
            this.ruleInfo.gn[0] = oRule.option.ip_stop_cheat
            this.ruleInfo.gn[2] = oRule.option.hand_ready
            this.ruleInfo.gn[3] = oRule.option.block_hu_dong
            if (oRule.option.request_dismiss == false)
                this.ruleInfo.gn[5] = false
            else
                this.ruleInfo.gn[5] = true 
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[0] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }
            if(oRule.option.owner_kickout_player == false)
                this.ruleInfo.gn[4] = false
            else
                this.ruleInfo.gn[4] = true
            if (oRule.trustee.second_opt >= 0)
            {
                this.ruleInfo.tg1[0] = false
                this.ruleInfo.tg1[oRule.trustee.second_opt+1] = true
            }
            if (oRule.room.auto_dismiss)
            {
                this.ruleInfo.tg2[0] = false
                this.ruleInfo.tg2[oRule.room.auto_dismiss.trustee_round] = true
            }
            if (oRule.option.gps_distance > 0){
                this.ruleInfo.gn[1] = true
                this.ruleInfo.gps_distance = oRule.option.gps_distance
            }
            
        }
        else
        {
            let save_rule_lrddz = cc.sys.localStorage.getItem("rule_ddz");
            if (save_rule_lrddz != null) {
                var saveInfo = JSON.parse(save_rule_lrddz);
                saveInfo.zf = this.ruleInfo.zf
                if (saveInfo.gn.length == 4)
                    saveInfo.gn = this.ruleInfo.gn
                saveInfo.ren = this.ruleInfo.ren
                this.ruleInfo = saveInfo
                cc.sys.localStorage.removeItem("rule_ddz");
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
        if (!this.ruleInfo.tg2)
        {
            this.ruleInfo.tg2 = [true, false, false, false, false]
        }
        if (this.ruleInfo.gn.length == 5)
        {
            this.ruleInfo.gn[5] = true
        }
        this.toggle_fd[this.ruleInfo.fd.indexOf(true)].check();
        this.ruleSelect(this.toggle_fd[this.ruleInfo.fd.indexOf(true)], true);

        this.toggle_rs[this.ruleInfo.ren.indexOf(true)].check();
        this.ruleSelect(this.toggle_rs[this.ruleInfo.ren.indexOf(true)], true);

        this.toggle_jushu[this.ruleInfo.ju_shu].check();
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);

        this.toggle_wf1[this.ruleInfo.wf1.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf1[this.ruleInfo.wf1.indexOf(true)], true);

        for (let idx = 0;idx<this.ruleInfo.wf2.length;idx++)
        {  
            if (this.ruleInfo.wf2[idx]){
                this.toggle_wf2[idx].check();
                this.ruleSelect(this.toggle_wf2[idx], true);
                this.ruleInfo.wf2[idx] = true
            }
        }

        for (let idx = 0;idx<this.ruleInfo.gn.length;idx++)
        {  
            if (this.ruleInfo.gn[idx]){
                this.toggle_gn[idx].check();
                this.ruleSelect(this.toggle_gn[idx], true);
                this.ruleInfo.gn[idx] = true
            }
        }
        if (!this.ruleInfo.zbcs)
            this.ruleInfo.zbcs = [true,false, false, false, false]
        this.toggle_zbcs[this.ruleInfo.zbcs.indexOf(true)].check();
        this.ruleSelect(this.toggle_zbcs[this.ruleInfo.zbcs.indexOf(true)], true);
        this.node.getChildByName("rule_tg2").active = this.ruleInfo.tg1.indexOf(true) != 0
        this.toggle_tg_1[this.ruleInfo.tg1.indexOf(true)].check();
        this.ruleSelect(this.toggle_tg_1[this.ruleInfo.tg1.indexOf(true)], true);
        this.toggle_tg_2[this.ruleInfo.tg2.indexOf(true)].check();
        this.ruleSelect(this.toggle_tg_2[this.ruleInfo.tg2.indexOf(true)], true);
        this.node.getChildByName("rule_tg2").active = this.ruleInfo.tg1.indexOf(true) != 0

        if (this.ruleInfo.gps_distance > 0)
            this.gps_str.string = this.ruleInfo.gps_distance.toString()
        else
            this.gps_str.string = "0"

        this.node.setContentSize(936, 1450);
        this.isInit = false;
        
    }

    public getRule()
    {
        var trustee = {}
        if (this.ruleInfo.tg1.indexOf(true) != 0)
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt:0}
        var room = null
        if (this.ruleInfo.tg1.indexOf(true) != 0)
        {
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt: 0}
            if (this.ruleInfo.tg2.indexOf(true) != 0)
                room = {player_count_option: this.ruleInfo.ren.indexOf(true), dismiss_all_agree: this.ruleInfo.wf2[5], auto_dismiss:{ trustee_round: this.ruleInfo.tg2.indexOf(true)}}
        }
        if (room == null)
            room = {player_count_option: this.ruleInfo.ren.indexOf(true), dismiss_all_agree: this.ruleInfo.wf2[5]}
        var gps  =this.ruleInfo.gps_distance
        if (!this.ruleInfo.gn[1])
            gps = -1
        var rule = {
            round: {option:this.ruleInfo.ju_shu},
            pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
            room: room,
            play: {
                max_times:this.ruleInfo.fd.indexOf(true),
                call_landlord:this.ruleInfo.wf1[0],
                call_score:this.ruleInfo.wf1[1],
                random_call:this.ruleInfo.wf2[0],
                san_da_must_call: this.ruleInfo.wf2[1],
                si_dai_er: this.ruleInfo.wf2[2],
                san_dai_er: this.ruleInfo.wf2[3],
                san_zhang: this.ruleInfo.wf2[4],
                ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
            },
            option:{
                ip_stop_cheat: this.ruleInfo.gn[0],
                hand_ready:this.ruleInfo.gn[2],     
                block_hu_dong:this.ruleInfo.gn[3],
                gps_distance:gps,
                owner_kickout_player: this.ruleInfo.gn[4],
                request_dismiss:this.ruleInfo.gn[5],            

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
        cc.sys.localStorage.setItem("rule_ddz", JSON.stringify(this.ruleInfo));

    }

    public setAllGrey()
    {
        return
        this.node.getChildByName("pingbi").active = true
        for (var idx = 0; idx < this.toggle_jushu.length; idx++)
            this.toggle_jushu[idx].interactable = false
        for (var idx = 0; idx < this.toggle_fd.length; idx++)
            this.toggle_fd[idx].interactable = false
        for (var idx = 0; idx < this.toggle_zf.length; idx++)
            this.toggle_zf[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf1.length; idx++)
            this.toggle_wf1[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf2.length; idx++)
            this.toggle_wf2[idx].interactable = false
        for (var idx = 0; idx < this.toggle_gn.length; idx++)
            this.toggle_gn[idx].interactable = false
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

    public btn_fd(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.fd.indexOf(true)
        this.ruleSelect(this.toggle_fd[originSelectIndex], false);
        this.ruleInfo.fd[originSelectIndex] =false
        this.ruleInfo.fd[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_fd[parseInt(customEventData)], true);
    }

    public btn_ren(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ren.indexOf(true)
        this.ruleSelect(this.toggle_rs[originSelectIndex], false);
        this.ruleInfo.ren[originSelectIndex] =false
        this.ruleInfo.ren[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_rs[parseInt(customEventData)], true, true);
    }

    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    public btn_wf1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf1.indexOf(true)
        this.ruleSelect(this.toggle_wf1[originSelectIndex], false);
        this.ruleInfo.wf1[originSelectIndex] =false
        this.ruleInfo.wf1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf1[parseInt(customEventData)], true);
    }


    public btn_wf2(event, customEventData)
    {
        this.ruleInfo.wf2[parseInt(customEventData)] = !this.ruleInfo.wf2[parseInt(customEventData)]
        this.ruleSelect(this.toggle_wf2[parseInt(customEventData)], this.ruleInfo.wf2[parseInt(customEventData)]);
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
        if (this.ruleInfo.tg1.indexOf(true) == 0)
        {
            this.ruleInfo.tg2 = [true, false, false, false, false];
        }
        this.node.getChildByName("rule_tg2").active = this.ruleInfo.tg1.indexOf(true) != 0
    }

    
    public btn_tg2(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.tg2.indexOf(true)
        this.ruleSelect(this.toggle_tg_2[originSelectIndex], false);
        this.ruleInfo.tg2[originSelectIndex] =false
        this.ruleInfo.tg2[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_tg_2[parseInt(customEventData)], true);
    }
        
    public btn_zbcs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zbcs.indexOf(true)
        this.ruleSelect(this.toggle_zbcs[originSelectIndex], false);
        this.ruleInfo.zbcs[originSelectIndex] =false
        this.ruleInfo.zbcs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zbcs[parseInt(customEventData)], true, true);
    }
}
