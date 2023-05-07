import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { AndroidInfo } from '../../../../proto/proto';

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_ZGMJ extends BaseRuleUI {
    protected static className = "RuleUI_ZGMJ";


    private gpsList = [100,300,500,1000]

    private ruleInfo = {
        ju_shu: [true, false, false, false],    // 4局, 6局, 8局, 10局
        rs: [true, false],          // 2/3 人
        zf: [true],                 // 老板支付
        fd: [true, false, false],   // 3,4,5番
        pf: [true, false, false],   // 不飘，随飘, 必飘
        lb: [true, false, false],   // 无萝卜, 1萝卜, 2萝卜
        wf1: [true, false, false],  // 自摸加底, 自摸加翻, 自摸不加
        wf2: [true, false ],        // 点杠花（点炮，自摸）
        wf3: [false, false, false, false, false, false, false],    // 金钩钓, 报叫, 过张升番可胡, 胡牌提示, 博自摸, 解散需要所有人同意, 有癞子
        gn: [false, false, true, false, true, true],// ip防作弊, 手动准备, 禁止互动, gps防作弊, 申请解散, 房主踢人
        zbcs: [true,false, false, false, false],    // 10  15 30 60 90
        tg1: [true, false, false, false],           // 不托管，30秒，60秒，120秒
        tg2: [true, false, false, false, false],    // 托管到底, 托管一局, 托管二局, 托管三局, 托管四局
        gps_distance: -1,
    }

    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];
    
    //人数
    @property([cc.Toggle])
    toggle_rs: cc.Toggle[] = [];

    //封顶
    @property([cc.Toggle])
    toggle_fd: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];


    //飘分
    @property([cc.Toggle])
    toggle_pf: cc.Toggle[] = [];

    //萝卜
    @property([cc.Toggle])
    toggle_lb: cc.Toggle[] = [];

    //玩法1
    @property([cc.Toggle])
    toggle_wf_1: cc.Toggle[] = [];

    //玩法2
    @property([cc.Toggle])
    toggle_wf_2: cc.Toggle[] = [];

    //玩法3
    @property([cc.Toggle])
    toggle_wf_3: cc.Toggle[] = [];

    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];

    //准备超时
    @property([cc.Toggle])
    toggle_zbcs: cc.Toggle[] = [];
    
    //托管1
    @property([cc.Toggle])
    toggle_tg_1: cc.Toggle[] = [];

    //托管2
    @property([cc.Toggle])
    toggle_tg_2: cc.Toggle[] = [];

    //gps 防作弊
    @property(cc.Label)
    gps_str: cc.Label = null;

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
            var originSelectIndex = this.ruleInfo.ju_shu.indexOf(true)
            this.ruleInfo.ju_shu[oRule.round.option] = true
            if(originSelectIndex != oRule.round.option)
            {
                this.ruleInfo.ju_shu[originSelectIndex] = false
            }
           
            this.ruleInfo.fd[0] = false
            this.ruleInfo.fd[oRule.fan.max_option] = true
            this.ruleInfo.zf[0] = false
            this.ruleInfo.zf[oRule.pay.option - 1] = true

            this.ruleInfo.pf[0] = false
            this.ruleInfo.pf[1] = false
            this.ruleInfo.pf[2] = false
            if (oRule.piao && (oRule.piao.piao_option==0 || oRule.piao.piao_option==1)) {
                this.ruleInfo.pf[oRule.piao.piao_option+1] = true
            }else{
                this.ruleInfo.pf[0] = true
            }

            this.ruleInfo.lb[0] = false
            this.ruleInfo.lb[1] = false
            this.ruleInfo.lb[2] = false
            if (oRule.luobo && (oRule.luobo.luobo_option==0 || oRule.luobo.luobo_option==1)) {
                this.ruleInfo.lb[oRule.luobo.luobo_option+1] = true
            }else{
                this.ruleInfo.lb[0] = true
            }

            this.ruleInfo.wf1[0] = oRule.play.zi_mo_jia_di    // 自摸加底
            this.ruleInfo.wf1[1] = oRule.play.zi_mo_jia_fan   // 自摸加翻
            this.ruleInfo.wf1[2] = oRule.play.zi_mo_bu_jia    // 自摸不加
						
            this.ruleInfo.wf2[0] = oRule.play.dgh_dian_pao    // 点杠花（点炮）
            this.ruleInfo.wf2[1] = oRule.play.dgh_zi_mo       // 点杠花（自摸）
							
            this.ruleInfo.wf3[0] = oRule.play.jin_gou_gou     // 金钩钓
            this.ruleInfo.wf3[1] = oRule.play.bao_jiao        // 报叫
            this.ruleInfo.wf3[2] = oRule.play.guo_zhuang_hu   // 过张升番可胡
            this.ruleInfo.wf3[3] = oRule.play.hu_tips         // 胡牌提示
            this.ruleInfo.wf3[4] = oRule.play.bo_zi_mo        // 博自摸,  需要特殊处理;  选择报叫之后才能选择博自摸
            this.ruleInfo.wf3[5] = oRule.play.guo_shou_peng   // 解散需要所有人同意
            this.ruleInfo.wf3[6] = oRule.play.lai_zi          // 有癞子
            originSelectIndex = this.ruleInfo.rs.indexOf(true)
            this.ruleInfo.rs[oRule.room.player_count_option] = true
            if(originSelectIndex != oRule.room.player_count_option)
            {
                this.ruleInfo.rs[originSelectIndex] = false
            }
            
            //选择报叫之后才能选择博自摸
            if (oRule.play.bao_jiao==true) {
                this.toggle_wf_3[4].enabled = true;
                this.toggle_wf_3[4].node.active = true;
                if (oRule.room.bo_zi_mo==true) {
                    this.ruleInfo.wf3[4] = oRule.room.bo_zi_mo   // 博自摸
                }
            }
            else
            {
                this.toggle_wf_3[4].enabled = false;
                this.toggle_wf_3[4].node.active = false;
            }

            this.ruleInfo.gn[0] = oRule.option.ip_stop_cheat
            this.ruleInfo.gn[2] = oRule.option.hand_ready
            this.ruleInfo.gn[3] = oRule.option.block_hu_dong
            if (oRule.option.request_dismiss == false)
                this.ruleInfo.gn[4] = false
            else
                this.ruleInfo.gn[4] = true 
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[0] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }
            if(oRule.option.owner_kickout_player == false)
                this.ruleInfo.gn[5] = false
            else
                this.ruleInfo.gn[5] = true
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
            let save_rule_xzmj = cc.sys.localStorage.getItem("rule_zgmj");
            if (save_rule_xzmj != null) {
                var saveInfo = JSON.parse(save_rule_xzmj);
                saveInfo.zf = this.ruleInfo.zf
                if (saveInfo.gn.length != 6)
                    saveInfo.gn[5] = true
                this.ruleInfo = saveInfo
                // cc.sys.localStorage.removeItem("rule_zgmj");
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
        if (this.ruleInfo.gn.length == 4)
        {
            this.ruleInfo.gn[4] = true
        }
        this.toggle_jushu[this.ruleInfo.ju_shu.indexOf(true)].check();
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu.indexOf(true)], true);

        this.toggle_rs[this.ruleInfo.rs.indexOf(true)].check()
        this.ruleSelect(this.toggle_rs[this.ruleInfo.rs.indexOf(true)],true)

        this.toggle_fd[this.ruleInfo.fd.indexOf(true)].check();
        this.ruleSelect(this.toggle_fd[this.ruleInfo.fd.indexOf(true)], true);

        this.toggle_wf_1[this.ruleInfo.wf1.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_1[this.ruleInfo.wf1.indexOf(true)], true);

        this.toggle_wf_2[this.ruleInfo.wf2.indexOf(true)].check();
        this.ruleSelect(this.toggle_wf_2[this.ruleInfo.wf2.indexOf(true)], true);

        this.toggle_pf[this.ruleInfo.pf.indexOf(true)].check();
        this.ruleSelect(this.toggle_pf[this.ruleInfo.pf.indexOf(true)], true);

        this.toggle_lb[this.ruleInfo.lb.indexOf(true)].check();
        this.ruleSelect(this.toggle_lb[this.ruleInfo.lb.indexOf(true)], true);

        for (let idx = 0;idx<this.ruleInfo.wf3.length;idx++)
        {  
            if (this.ruleInfo.wf3[idx]){
                this.toggle_wf_3[idx].check();
                this.ruleSelect(this.toggle_wf_3[idx], true);
                this.ruleInfo.wf3[idx] = true
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

        this.node.setContentSize(936, 1500);
        this.isInit = false;
        
    }

    public getRule()
    {
        var trustee = {}
        if (this.ruleInfo.tg1.indexOf(true) != 0)
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt: 0}
        var room = null
        if (this.ruleInfo.tg1.indexOf(true) != 0)
        {
            trustee = {second_opt:this.ruleInfo.tg1.indexOf(true)-1, type_opt: 0}
            if (this.ruleInfo.tg2.indexOf(true) != 0)
                room = {player_count_option: this.ruleInfo.rs.indexOf(true), dismiss_all_agree: this.ruleInfo.wf3[6], auto_dismiss:{ trustee_round: this.ruleInfo.tg2.indexOf(true)}}
        }
        if (room == null)
            room = {player_count_option: this.ruleInfo.rs.indexOf(true), dismiss_all_agree: this.ruleInfo.wf3[6]}
    
        var gps  =this.ruleInfo.gps_distance
        if (!this.ruleInfo.gn[1])
            gps = -1

        var piao = null
        if (this.ruleInfo.pf.indexOf(true)>0) {
            piao = {piao_option:this.ruleInfo.pf.indexOf(true)-1}
        }

        var luobo = null
        if (this.ruleInfo.lb.indexOf(true)>0) {
            luobo = {luobo_option:this.ruleInfo.lb.indexOf(true)-1}
        }

        var rule = {
            round: {option:this.ruleInfo.ju_shu.indexOf(true)},
            fan: {max_option:this.ruleInfo.fd.indexOf(true)},
            pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
            room: room,
            play: {
                zi_mo_jia_di:   this.ruleInfo.wf1[0], // 自摸加底
                zi_mo_jia_fan:  this.ruleInfo.wf1[1], // 自摸加翻
                zi_mo_bu_jia:   this.ruleInfo.wf1[2], // 自摸不加

                dgh_dian_pao:   this.ruleInfo.wf2[0], // 点杠花（点炮）
                dgh_zi_mo:      this.ruleInfo.wf2[1], //  点杠花（自摸）

                jin_gou_gou:    this.ruleInfo.wf3[0], // 金钩钓
                bao_jiao:       this.ruleInfo.wf3[1], // 报叫
                guo_zhuang_hu:  this.ruleInfo.wf3[2], // 过张升番可胡
                hu_tips:        this.ruleInfo.wf3[3], // 胡牌提示
                bo_zi_mo:       this.ruleInfo.wf3[4], // 博自摸
                guo_shou_peng:  this.ruleInfo.wf3[5], // 解散需要所有人同意
                lai_zi:         this.ruleInfo.wf3[6], // 有癞子

                ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
            },
            option:{
                ip_stop_cheat: this.ruleInfo.gn[0],
                hand_ready:this.ruleInfo.gn[2],     
                block_hu_dong:this.ruleInfo.gn[3],
                request_dismiss:this.ruleInfo.gn[4],      
                owner_kickout_player: this.ruleInfo.gn[5],
                gps_distance:gps         

            },
            trustee:trustee,
        }
        if ( piao) {
            rule["piao"] = piao
        }

        if ( luobo) {
            rule["luobo"] = luobo
        }

        if (this.ruleInfo.wf3[1]==false) {
            rule.play["bo_zi_mo"]=false
        }
        return rule
    }

    public getCostInfo()
    {   
        return this.ruleInfo.ju_shu[0] == true ? 3 : 2;
    }

    public saveRule()
    {
        cc.sys.localStorage.setItem("rule_zgmj", JSON.stringify(this.ruleInfo));
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
        for (var idx = 0; idx < this.toggle_wf_1.length; idx++)
            this.toggle_wf_1[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_2.length; idx++)
            this.toggle_wf_2[idx].interactable = false
        for (var idx = 0; idx < this.toggle_wf_3.length; idx++)
            this.toggle_wf_3[idx].interactable = false
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

    // 局数
    public btn_jushu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ju_shu.indexOf(true)
        this.ruleSelect(this.toggle_jushu[originSelectIndex], false);
        this.ruleInfo.ju_shu[originSelectIndex] =false
        this.ruleInfo.ju_shu[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_jushu[parseInt(customEventData)], true); 
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    // 人数
    public btn_rs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.rs.indexOf(true)
        this.ruleSelect(this.toggle_rs[originSelectIndex], false);
        this.ruleInfo.rs[originSelectIndex] =false
        this.ruleInfo.rs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_rs[parseInt(customEventData)], true);    
    }

    // 封顶
    public btn_fd(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.fd.indexOf(true)
        this.ruleSelect(this.toggle_fd[originSelectIndex], false);
        this.ruleInfo.fd[originSelectIndex] =false
        this.ruleInfo.fd[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_fd[parseInt(customEventData)], true);
    }

    // 支付
    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    // 飘分
    public btn_pf(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.pf.indexOf(true)
        this.ruleSelect(this.toggle_pf[originSelectIndex], false);
        this.ruleInfo.pf[originSelectIndex] =false
        this.ruleInfo.pf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_pf[parseInt(customEventData)], true, false);
    }

    // 萝卜
    public btn_lb(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.lb.indexOf(true)
        this.ruleSelect(this.toggle_lb[originSelectIndex], false);
        this.ruleInfo.lb[originSelectIndex] =false
        this.ruleInfo.lb[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_lb[parseInt(customEventData)], true);
         
    }

    public btn_wf1(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf1.indexOf(true)
        this.ruleSelect(this.toggle_wf_1[originSelectIndex], false);
        this.ruleInfo.wf1[originSelectIndex] =false
        this.ruleInfo.wf1[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_1[parseInt(customEventData)], true);
         
    }

    public btn_wf2(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.wf2.indexOf(true)
        this.ruleSelect(this.toggle_wf_2[originSelectIndex], false);
        this.ruleInfo.wf2[originSelectIndex] =false
        this.ruleInfo.wf2[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_wf_2[parseInt(customEventData)], true);
    }

    public btn_wf3(event, customEventData)
    {
        this.ruleInfo.wf3[parseInt(customEventData)] = this.toggle_wf_3[customEventData].isChecked;
        this.ruleSelect(this.toggle_wf_3[parseInt(customEventData)], this.toggle_wf_3[parseInt(customEventData)].isChecked); 

        //选择报叫之后才能选择博自摸
        if (1==customEventData) {   //报叫
            if (this.toggle_wf_3[customEventData].isChecked) {
                this.toggle_wf_3[4].enabled = true;
                this.toggle_wf_3[4].node.active = true;
            }
            else
            {
                this.toggle_wf_3[4].isChecked = false;
                this.toggle_wf_3[4].enabled = false;
                this.toggle_wf_3[4].node.active = false;
            }
        }
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
