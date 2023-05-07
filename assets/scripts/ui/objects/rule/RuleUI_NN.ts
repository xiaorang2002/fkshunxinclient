import { ListenerType } from './../../../data/ListenerType';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_NN extends BaseRuleUI {
    protected static className = "RuleUI_NN";


    private gpsList = [100,300,500,1000]
    private cmTimes = [0,2,3,4,5,6,7,8,9,10,15,20,25,30,40,50,60,70,80,90,100]
    private baseScoreList = [1,2,3,4,5,6,7,8,9,10,15,20,25,30,40,50,60,70,80,90,100]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        ren: [true, false],
        kz: [true, false, false, false, false, false],  // 首位开桌 2 3 4 5 6
        zz: [true, false, false], // 明牌抢庄，无庄通比，轮流坐庄
        qzbs: [true, false, false], // 2,3,4倍（只有明牌抢庄有）
        ap: [true, false, false, false, false], // 全暗，暗一，暗二，暗三，暗四
        dfms:[true, false], // 经典选分，趣味选分，
        df: [true, false, false, false, false], // 经典选分，趣味选分，无庄通比的分数需要改变
        wf: [true, true, true, true, true, true, true, true], // 顺子牛，五花牛....
        fb: [true, false], // 牛牛，牛九..等倍数
        cs: [true, false, false, false, false], //  5 10 15 30 45
        zbcs: [true,false, false, false, false, false], // 5 10 15 30 60 90
        gn: [false, false, true, false, false, true, false], // ip防作弊 gps防作弊, 房主踢人 禁止互动, 禁止中途加入
        gps_distance: -1,

    }
    @property(cc.Label)
    price1: cc.Label = null;

    @property(cc.Label)
    price2: cc.Label = null;

    @property(cc.Label)
    price3: cc.Label = null;

    @property(cc.Label)
    price4: cc.Label = null;

    @property(cc.Label)
    gps_str: cc.Label = null;
    
    @property(cc.Label)
    score1: cc.Label = null;

    @property(cc.Label)
    score2: cc.Label = null;

    @property(cc.Label)
    score3: cc.Label = null;

    @property(cc.Label)
    score4: cc.Label = null;
    
    @property(cc.Label)
    score5: cc.Label = null;

    @property(cc.Label)
    score6: cc.Label = null;

    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];

    //人数
    @property([cc.Toggle])
    toggle_rs: cc.Toggle[] = [];

    //开桌
    @property([cc.Toggle])
    toggle_kz: cc.Toggle[] = [];

    //坐庄
    @property([cc.Toggle])
    toggle_zz: cc.Toggle[] = [];

    //抢庄倍数
    @property([cc.Toggle])
    toggle_qzbs: cc.Toggle[] = [];

    //暗牌
    @property([cc.Toggle])
    toggle_ap: cc.Toggle[] = [];

    //底分
    @property([cc.Toggle])
    toggle_dfms: cc.Toggle[] = [];

    //底分
    @property([cc.Toggle])
    toggle_df: cc.Toggle[] = [];

    //玩法
    @property([cc.Toggle])
    toggle_wf: cc.Toggle[] = [];
    
    //翻倍
    @property([cc.Toggle])
    toggle_fb: cc.Toggle[] = [];

    //超时
    @property([cc.Toggle])
    toggle_cs: cc.Toggle[] = [];
    
    //准备超时
    @property([cc.Toggle])
    toggle_zbcs: cc.Toggle[] = [];

    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];
   

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
            this.ruleInfo.ren[0] = false
            this.ruleInfo.ren[oRule.room.player_count_option] = true
            if (oRule.room.min_gamer_count >= 0)
            {
                this.ruleInfo.kz[1] = false
                if (oRule.room.owner_start == true)
                    this.ruleInfo.kz[0] = true
                else
                    this.ruleInfo.kz[oRule.room.min_gamer_count+1] = true
            }
            this.ruleInfo.zz[0] = false
            if (oRule.play.call_banker)
                this.ruleInfo.zz[0] = true
            else if (oRule.play.no_banker_compare)
                this.ruleInfo.zz[1] = true
            else
                this.ruleInfo.zz[2] = true
            this.ruleInfo.qzbs[0] = false
            this.ruleInfo.qzbs[oRule.play.call_banker_times-2] = true
            this.ruleInfo.ap[0] = false
            this.ruleInfo.ap[oRule.play.an_pai_option] = true
            this.ruleInfo.df[0] = false
            this.ruleInfo.df[this.getBaseScoreIdx(oRule.play.base_score)] = true
            this.ruleInfo.dfms[0] = false
            if (oRule.play.base_score.length > 2)
                this.ruleInfo.dfms[1] = true
            else
                this.ruleInfo.dfms[0] = true
            this.ruleInfo.fb[0] = false
            if (oRule.play.ox_times[11] == 4)
                this.ruleInfo.fb[0] = true
            else
                this.ruleInfo.fb[1] = true
            if (oRule.play.ox_times[21] != 5)
                this.ruleInfo.wf[0] = false
            if (oRule.play.ox_times[22] != 5)
                this.ruleInfo.wf[1] = false
            if (oRule.play.ox_times[23] != 5)
                this.ruleInfo.wf[2] = false   
            if (oRule.play.ox_times[24] != 6)
                this.ruleInfo.wf[3] = false  
            if (oRule.play.ox_times[25] != 6)
                this.ruleInfo.wf[4] = false  
            if (oRule.play.ox_times[26] != 7)
                this.ruleInfo.wf[5] = false  
            if (oRule.play.ox_times[27] != 8)
                this.ruleInfo.wf[6] = false  
            if (oRule.play.ox_times[28] != 10)
                this.ruleInfo.wf[7] = false 
            if (oRule.trustee.second_opt >= 0)
            {
                this.ruleInfo.cs[0] = false
                this.ruleInfo.cs[oRule.trustee.second_opt] = true
            }
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[0] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }
            this.ruleInfo.gn[0] = oRule.option.ip_stop_cheat
            if(oRule.option.block_hu_dong == true)
                this.ruleInfo.gn[3] = true
            else
                this.ruleInfo.gn[3] = false
            if(oRule.option.block_join_when_gaming == true)
                this.ruleInfo.gn[4] = true
            else
                this.ruleInfo.gn[4] = false
            if(oRule.option.block_voice == true)
                this.ruleInfo.gn[6] = true
            else
                this.ruleInfo.gn[6] = false
            if(oRule.option.owner_kickout_player == false)
                this.ruleInfo.gn[2] = false
            else
                this.ruleInfo.gn[2] = true
            if (oRule.play.continue_game != undefined)
                this.ruleInfo.gn[5] = oRule.play.continue_game
        }
        else
        {
            let save_rule_nn = cc.sys.localStorage.getItem("rule_nn");
            if (save_rule_nn != null) {
                var saveInfo = JSON.parse(save_rule_nn);
                saveInfo.zf = this.ruleInfo.zf
                saveInfo.gn = this.ruleInfo.gn
                this.ruleInfo = saveInfo
                cc.sys.localStorage.removeItem("rule_nn");
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

        this.toggle_rs[this.ruleInfo.ren.indexOf(true)].check();
        this.ruleSelect(this.toggle_rs[this.ruleInfo.ren.indexOf(true)], true);

        if (this.ruleInfo.ren[0])
        {
            this.price1.string = "x8"
            this.price2.string = "x12"
            this.price3.string = "x16"
            this.price4.string = "x20"
        }
        else
        {
            this.price1.string = "x10"
            this.price2.string = "x14"
            this.price3.string = "x18" 
            this.price4.string = "x22" 
        }

        this.toggle_kz[this.ruleInfo.kz.indexOf(true)].check();
        this.ruleSelect(this.toggle_kz[this.ruleInfo.kz.indexOf(true)], true);

        this.toggle_zz[this.ruleInfo.zz.indexOf(true)].check();
        this.ruleSelect(this.toggle_zz[this.ruleInfo.zz.indexOf(true)], true);

        this.toggle_qzbs[this.ruleInfo.qzbs.indexOf(true)].check();
        this.ruleSelect(this.toggle_qzbs[this.ruleInfo.qzbs.indexOf(true)], true);

        this.toggle_ap[this.ruleInfo.ap.indexOf(true)].check();
        this.ruleSelect(this.toggle_ap[this.ruleInfo.ap.indexOf(true)], true);

        this.toggle_dfms[this.ruleInfo.dfms.indexOf(true)].check();
        this.ruleSelect(this.toggle_dfms[this.ruleInfo.dfms.indexOf(true)], true);

        this.toggle_df[this.ruleInfo.df.indexOf(true)].check();
        this.ruleSelect(this.toggle_df[this.ruleInfo.df.indexOf(true)], true);

        this.toggle_fb[this.ruleInfo.fb.indexOf(true)].check();
        this.ruleSelect(this.toggle_fb[this.ruleInfo.fb.indexOf(true)], true);

        for (let idx = 0;idx<this.ruleInfo.wf.length;idx++)
        {  
            if (this.ruleInfo.wf[idx]){
                this.toggle_wf[idx].check();
                this.ruleSelect(this.toggle_wf[idx], true);
                this.ruleInfo.wf[idx] = true
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

        this.toggle_cs[this.ruleInfo.cs.indexOf(true)].check();
        this.ruleSelect(this.toggle_cs[this.ruleInfo.cs.indexOf(true)], true);

        if (!this.ruleInfo.zbcs)
            this.ruleInfo.zbcs = [true,false, false, false, false]
        this.toggle_zbcs[this.ruleInfo.zbcs.indexOf(true)].check();
        this.ruleSelect(this.toggle_zbcs[this.ruleInfo.zbcs.indexOf(true)], true);

        if (this.ruleInfo.gps_distance > 0)
            this.gps_str.string = this.ruleInfo.gps_distance.toString()
        else
            this.gps_str.string = "0"
        this.updateBaseScore()
        this.node.setContentSize(936, 1830);
        this.isInit = false;
        
    }

    public getBaseScore()
    {
        var scoreList1 = [[1],[2],[3],[4],[5],[6]]
        var scoreList2 = [[1,2],[2,4],[3,6],[4,8],[5,10],[10,20]]
        var scoreList3 = [[1,2,4,5],[2,3,4,5],[2,4,8,10],[3,6,12,15],[4,8,16,20],[5,10,20,25]]
        if (this.ruleInfo.zz.indexOf(true) != 1)
        {
            if (this.ruleInfo.dfms.indexOf(true) == 0)
                return scoreList2[this.ruleInfo.df.indexOf(true)]
            else
                return scoreList3[this.ruleInfo.df.indexOf(true)]
        }
        else
            return scoreList1[this.ruleInfo.df.indexOf(true)]
    }

    public getBaseScoreIdx(scoreList)
    {
        if (scoreList.length > 2)
        {
            if (scoreList[1] == 2)
                return 0
            else if (scoreList[1] == 3)
                return 1
            else if (scoreList[1] == 4)
                return 2
            else if (scoreList[1] == 6)
                return 3
            else if (scoreList[1] == 8)
                return 4
            else
                return 5
        }
        else
        {
            return scoreList[0] - 1
        }
    }

    public getRule()
    {
        var gps = this.ruleInfo.gps_distance
        var trustee = {}
        trustee = {second_opt:this.ruleInfo.cs.indexOf(true), type_opt: 0}
        if (!this.ruleInfo.gn[1])
            gps = -1
        var room = null
        if (this.ruleInfo.kz.indexOf(true) != 0)
            room = {player_count_option:this.ruleInfo.ren.indexOf(true), dismiss_all_agree: true, min_gamer_count: this.ruleInfo.kz.indexOf(true) - 1}
        else
            room = {player_count_option:this.ruleInfo.ren.indexOf(true), dismiss_all_agree: true, min_gamer_count: 0, owner_start:true}
        
        var oxTimes = {28:0, 27:0, 26:0, 25:0, 24:0, 23:0, 22:0, 21:0, 11:4, 10:3, 9:2, 8:2, 7:1, 6:1, 5:1, 4:1, 3:1, 2:1}
        if (this.ruleInfo.fb.indexOf(true) == 1)
            oxTimes = {28:0, 27:0, 26:0, 25:0, 24:0, 23:0, 22:0, 21:0, 11:3, 10:2, 9:2, 8:1, 7:1, 6:1, 5:1, 4:1, 3:1, 2:1}
        if(this.ruleInfo.wf[0])
            oxTimes[21] = 5
        if(this.ruleInfo.wf[1])
            oxTimes[22] = 5
        if(this.ruleInfo.wf[2])
            oxTimes[23] = 5
        if(this.ruleInfo.wf[3])
            oxTimes[24] = 6
        if(this.ruleInfo.wf[4])
            oxTimes[25] = 6
        if(this.ruleInfo.wf[5])
            oxTimes[26] = 7
        if(this.ruleInfo.wf[6])
            oxTimes[27] = 8
        if(this.ruleInfo.wf[7])
            oxTimes[28] = 10
        var rule = {
        round: {option:this.ruleInfo.ju_shu},
        pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
        room: room,
        play: {
            call_banker:this.ruleInfo.zz[0],
            no_banker_compare:this.ruleInfo.zz[1],
            banker_take_turn:this.ruleInfo.zz[2],
            call_banker_times:this.ruleInfo.qzbs.indexOf(true)+2,
            an_pai_option:this.ruleInfo.ap.indexOf(true),
            base_score:this.getBaseScore(),
            ox_times:oxTimes,
            ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
            continue_game:this.ruleInfo.gn[5],
        },
            option:{
                ip_stop_cheat: this.ruleInfo.gn[0],
                gps_distance:gps,
                owner_kickout_player: this.ruleInfo.gn[2],
                block_hu_dong:this.ruleInfo.gn[3],
                block_join_when_gaming:this.ruleInfo.gn[4],
                block_voice:this.ruleInfo.gn[6]         
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
        cc.sys.localStorage.setItem("rule_nn", JSON.stringify(this.ruleInfo));

    }

    public setAllGrey()
    {
        return
    }

    public updateBaseScore()
    {
        var zhuangIdx = this.ruleInfo.zz.indexOf(true)
        var baseScoreList = []
        this.node.getChildByName("rule_qzbs").active = zhuangIdx == 0

        if (zhuangIdx == 1) // 无庄通比
            baseScoreList = ["1","2","3","4","5","6"]
        else{
            var baseScoreType = this.ruleInfo.dfms.indexOf(true)
            if (baseScoreType == 0)
                baseScoreList = ["1/2","2/4","3/6","4/8","5/10","10/20"]
            else
                baseScoreList = ["1/2/4/5","2/3/4/5","2/4/8/10","3/6/12/15","4/8/16/20","5/10/20/25"]
        }
        this.score1.string = baseScoreList[0]
        this.score2.string = baseScoreList[1]
        this.score3.string = baseScoreList[2]
        this.score4.string = baseScoreList[3]
        this.score5.string = baseScoreList[4]
        this.score6.string = baseScoreList[5]
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


    public btn_ren(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ren.indexOf(true)
        this.ruleSelect(this.toggle_rs[originSelectIndex], false);
        this.ruleInfo.ren[originSelectIndex] =false
        this.ruleInfo.ren[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_rs[parseInt(customEventData)], true, true);
        if (this.ruleInfo.ren[0])
        {
            this.price1.string = "x8"
            this.price2.string = "x12"
            this.price3.string = "x16"
            this.price4.string = "x20"
        }
        else
        {
            this.price1.string = "x10"
            this.price2.string = "x14"
            this.price3.string = "x18" 
            this.price4.string = "x22" 
        }
    }

    public btn_zhifu(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zf.indexOf(true)
        this.ruleSelect(this.toggle_zf[originSelectIndex], false);
        this.ruleInfo.zf[originSelectIndex] =false
        this.ruleInfo.zf[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zf[parseInt(customEventData)], true, false);
    }

    public btn_jushu(event, customEventData)
    {
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], false);
        this.ruleInfo.ju_shu = parseInt(customEventData);
        this.ruleSelect(this.toggle_jushu[this.ruleInfo.ju_shu], true);
        MessageManager.getInstance().messagePost(ListenerType.ruleCostChanged);
    }

    public btn_kz(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.kz.indexOf(true)
        this.ruleSelect(this.toggle_kz[originSelectIndex], false);
        this.ruleInfo.kz[originSelectIndex] =false
        this.ruleInfo.kz[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_kz[parseInt(customEventData)], true, true);
    }

    
    public btn_zz(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zz.indexOf(true)
        this.ruleSelect(this.toggle_zz[originSelectIndex], false);
        this.ruleInfo.zz[originSelectIndex] =false
        this.ruleInfo.zz[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zz[parseInt(customEventData)], true, true);
        this.updateBaseScore()
    }

    public btn_qzbs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.qzbs.indexOf(true)
        this.ruleSelect(this.toggle_qzbs[originSelectIndex], false);
        this.ruleInfo.qzbs[originSelectIndex] =false
        this.ruleInfo.qzbs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_qzbs[parseInt(customEventData)], true, true);
    }

    public btn_ap(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ap.indexOf(true)
        this.ruleSelect(this.toggle_ap[originSelectIndex], false);
        this.ruleInfo.ap[originSelectIndex] =false
        this.ruleInfo.ap[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_ap[parseInt(customEventData)], true, true);
    }

    public btn_dfms(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.dfms.indexOf(true)
        this.ruleSelect(this.toggle_dfms[originSelectIndex], false);
        this.ruleInfo.dfms[originSelectIndex] =false
        this.ruleInfo.dfms[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_dfms[parseInt(customEventData)], true, true);
        this.updateBaseScore()
    }

    public btn_df(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.df.indexOf(true)
        this.ruleSelect(this.toggle_df[originSelectIndex], false);
        this.ruleInfo.df[originSelectIndex] =false
        this.ruleInfo.df[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_df[parseInt(customEventData)], true, true);
    }

    public btn_fb(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.fb.indexOf(true)
        this.ruleSelect(this.toggle_fb[originSelectIndex], false);
        this.ruleInfo.fb[originSelectIndex] =false
        this.ruleInfo.fb[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_fb[parseInt(customEventData)], true, true);
    }


    public btn_cs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.cs.indexOf(true)
        this.ruleSelect(this.toggle_cs[originSelectIndex], false);
        this.ruleInfo.cs[originSelectIndex] =false
        this.ruleInfo.cs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_cs[parseInt(customEventData)], true, true);
    }

    public btn_zbcs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zbcs.indexOf(true)
        this.ruleSelect(this.toggle_zbcs[originSelectIndex], false);
        this.ruleInfo.zbcs[originSelectIndex] =false
        this.ruleInfo.zbcs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zbcs[parseInt(customEventData)], true, true);
    }

    public btn_wf(event, customEventData)
    {
        this.ruleInfo.wf[parseInt(customEventData)] = !this.ruleInfo.wf[parseInt(customEventData)]
        this.ruleSelect(this.toggle_wf[parseInt(customEventData)], this.ruleInfo.wf[parseInt(customEventData)]);
    }

    public btn_gn(event, customEventData)
    {
        this.ruleInfo.gn[parseInt(customEventData)] = !this.ruleInfo.gn[parseInt(customEventData)]
        this.ruleSelect(this.toggle_gn[parseInt(customEventData)], this.ruleInfo.gn[parseInt(customEventData)]);
    }
    
}
