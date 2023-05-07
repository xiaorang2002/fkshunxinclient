import { ListenerType } from './../../../data/ListenerType';
import { GameManager } from './../../../GameManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { BaseRuleUI } from "./BaseRuleUI";
import { MessageManager } from "../../../../framework/Manager/MessageManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class RuleUI_ZJH extends BaseRuleUI {
    protected static className = "RuleUI_ZJH";


    private gpsList = [100,300,500,1000]
    private cmTimes = [0,2,3,4,5,6,7,8,9,10,15,20,25,30,40,50,60,70,80,90,100]
    private baseScoreList = [1,2,3,4,5,6,7,8,9,10,15,20,25,30,40,50,60,70,80,90,100]

    private ruleInfo = {
        ju_shu: 0, // 局数下标
        df: 1,     // 底分  
        mz: 1, //闷注
        zf: [true, false, false],  // AA支付 老板支付 房主支付
        ren: [true, false],
        kz: [false, true, false, false, false, false],  // 首位开桌 2 3 4 5 6
        ls: [true, false, false], // 轮数 8 10 12
        mp: [true, false, false, false, false], // 闷牌 不闷 1 2 3 5
        cm: {1:2, 2:3, 3:4}, // 筹码 倍数
        bp: [true, false],  // 先比为输 黑红梅方    
        wf: [false, false, false, false, false, false, true, true], // 顺金收喜钱，豹子收喜钱，235>豹子，123<234，双倍比牌，公布比牌， 必闷可加注
        cs: [true, false, false, false, false, false], // 不超时 5 10 15 30 45
        zbcs: [true,false, false, false, false, false], // 5 10 15 30 60 90
        cz: [true, false],  // 超时弃牌 超时跟注    
        gn: [false, false, true, false, false, true, false], // ip防作弊 gps防作弊, 房主踢人 禁止互动, 禁止中途加入,禁止语音
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
   
    //局数
    @property([cc.Toggle])
    toggle_jushu: cc.Toggle[] = [];

    //支付
    @property([cc.Toggle])
    toggle_zf: cc.Toggle[] = [];

    //人数
    @property([cc.Toggle])
    toggle_rs: cc.Toggle[] = [];

    //玩法
    @property([cc.Toggle])
    toggle_kz: cc.Toggle[] = [];

    //轮数
    @property([cc.Toggle])
    toggle_ls: cc.Toggle[] = [];

    //闷牌
    @property([cc.Toggle])
    toggle_mp: cc.Toggle[] = [];

    //比牌
    @property([cc.Toggle])
    toggle_bp: cc.Toggle[] = [];

    //比牌
    @property([cc.Toggle])
    toggle_wf: cc.Toggle[] = [];

    //超时
    @property([cc.Toggle])
    toggle_cs: cc.Toggle[] = [];
    
    //准备超时
    @property([cc.Toggle])
    toggle_zbcs: cc.Toggle[] = [];

    //操作
    @property([cc.Toggle])
    toggle_cz: cc.Toggle[] = [];
    
    //功能
    @property([cc.Toggle])
    toggle_gn: cc.Toggle[] = [];
   
    @property(cc.Label)
    baseScore: cc.Label = null;

    @property(cc.Label)
    menScore: cc.Label = null;

    @property(cc.Label)
    labelChips1: cc.Label = null;
   
    @property(cc.Label)
    labelChips2: cc.Label = null;
   
    @property(cc.Label)
    labelChips3: cc.Label = null;
   

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
            this.ruleInfo.df = oRule.play.base_score
            this.ruleInfo.mz = oRule.play.base_men_score
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
            this.ruleInfo.ls[0] = false
            this.ruleInfo.ls[oRule.play.max_turn_option] = true
            this.ruleInfo.mp[0] = false
            this.ruleInfo.mp[oRule.play.men_turn_option] = true
            this.ruleInfo.cm[1] = oRule.play.chip_score[0]
            this.ruleInfo.cm[2] = oRule.play.chip_score[1]
            this.ruleInfo.cm[3] = oRule.play.chip_score[2]
            this.ruleInfo.bp[0] = oRule.play.lose_compare_first
            this.ruleInfo.bp[1] = oRule.play.color_compare
            this.ruleInfo.wf[0] = oRule.play.bonus_shunjin
            this.ruleInfo.wf[1] = oRule.play.bonus_bao_zi
            this.ruleInfo.wf[2] = oRule.play.baozi_less_than_235
            this.ruleInfo.wf[3] = oRule.play.small_A23
            this.ruleInfo.wf[4] = oRule.play.double_compare
            this.ruleInfo.wf[5] = oRule.play.show_card
            this.ruleInfo.wf[6] = oRule.play.can_add_score_in_men_turns
            if (oRule.play.continue_game != undefined)
                this.ruleInfo.wf[7] = oRule.play.continue_game
            if (oRule.trustee.second_opt >= 0)
            {
                this.ruleInfo.cs[0] = false
                this.ruleInfo.cs[oRule.trustee.second_opt+1] = true
                if (oRule.play.trustee_drop != undefined)
                {
                    this.ruleInfo.cz[0] = oRule.play.trustee_drop 
                    this.ruleInfo.cz[1] = oRule.play.trustee_follow
                }
            }
            if (oRule.play.ready_timeout_option >= 0)
            {
                this.ruleInfo.zbcs[1] = false
                this.ruleInfo.zbcs[oRule.play.ready_timeout_option] = true
            }
            this.ruleInfo.gn[0] = oRule.option.ip_stop_cheat
            this.ruleInfo.gn[5] = oRule.option.request_dismiss
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
        }
        else
        {
            let save_rule_zjh = cc.sys.localStorage.getItem("rule_zjh");
            if (save_rule_zjh != null) {
                var saveInfo = JSON.parse(save_rule_zjh);
                saveInfo.zf = this.ruleInfo.zf
                saveInfo.gn = this.ruleInfo.gn
                this.ruleInfo = saveInfo
                cc.sys.localStorage.removeItem("rule_zjh");
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

        this.toggle_ls[this.ruleInfo.ls.indexOf(true)].check();
        this.ruleSelect(this.toggle_ls[this.ruleInfo.ls.indexOf(true)], true);

        this.toggle_mp[this.ruleInfo.mp.indexOf(true)].check();
        this.ruleSelect(this.toggle_mp[this.ruleInfo.mp.indexOf(true)], true);

        this.toggle_bp[this.ruleInfo.bp.indexOf(true)].check();
        this.ruleSelect(this.toggle_bp[this.ruleInfo.bp.indexOf(true)], true);

        this.baseScore.string = this.ruleInfo.df.toString();
        if (this.ruleInfo.mz)
            this.menScore.string = this.ruleInfo.mz.toString();
        else
            this.menScore.string = this.baseScore.string;
        this.labelChips1.string = this.ruleInfo.cm[1].toString();
        this.labelChips2.string = this.ruleInfo.cm[2].toString();
        this.labelChips3.string = this.ruleInfo.cm[3].toString();

        for (let idx = 0;idx<this.ruleInfo.wf.length;idx++)
        {  
            if (this.ruleInfo.wf[idx]){
                this.toggle_wf[idx].check();
                this.ruleSelect(this.toggle_wf[idx], true);
                this.ruleInfo.wf[idx] = true
            }
        }

        this.toggle_wf[6].node.active = !this.ruleInfo.mp[0]

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

        this.toggle_cz[this.ruleInfo.cz.indexOf(true)].check();
        this.ruleSelect(this.toggle_cz[this.ruleInfo.cz.indexOf(true)], true);

        if (this.ruleInfo.cs[0] != true)
            this.node.getChildByName("rule_cz").active = true
        else
            this.node.getChildByName("rule_cz").active = false

        if (this.ruleInfo.gps_distance > 0)
            this.gps_str.string = this.ruleInfo.gps_distance.toString()
        else
            this.gps_str.string = "0"

        this.node.setContentSize(936, 1830);
        this.isInit = false;
        
    }

    public getRule()
    {
        var gps = this.ruleInfo.gps_distance
        var trustee = {}
        if (this.ruleInfo.cs.indexOf(true) != 0)
            trustee = {second_opt:this.ruleInfo.cs.indexOf(true)-1, type_opt: 0}
        if (!this.ruleInfo.gn[1])
            gps = -1
        var room = null
        if (this.ruleInfo.kz.indexOf(true) != 0)
            room = {player_count_option:this.ruleInfo.ren.indexOf(true), dismiss_all_agree: true, min_gamer_count: this.ruleInfo.kz.indexOf(true) - 1}
        else
            room = {player_count_option:this.ruleInfo.ren.indexOf(true), dismiss_all_agree: true, min_gamer_count: 0, owner_start:true}
        var rule = {
        round: {option:this.ruleInfo.ju_shu},
        pay: {money_type: 1, option: this.ruleInfo.zf.indexOf(true)+1},
        room: room,
        play: {
            max_turn_option:this.ruleInfo.ls.indexOf(true),
            men_turn_option:this.ruleInfo.mp.indexOf(true),
            base_score:this.ruleInfo.df,
            base_men_score:this.ruleInfo.mz,
            chip_score:[this.ruleInfo.cm[1], this.ruleInfo.cm[2], this.ruleInfo.cm[3]],
            lose_compare_first:this.ruleInfo.bp[0],
            color_compare:this.ruleInfo.bp[1],
            bonus_shunjin:this.ruleInfo.wf[0],
            bonus_bao_zi: this.ruleInfo.wf[1],
            baozi_less_than_235: this.ruleInfo.wf[2],
            small_A23: this.ruleInfo.wf[3],
            double_compare: this.ruleInfo.wf[4],
            show_card: this.ruleInfo.wf[5],
            can_add_score_in_men_turns: this.ruleInfo.wf[6] || this.ruleInfo.mp[0],
            continue_game:this.ruleInfo.wf[7],
            trustee_drop:this.ruleInfo.cz[0],
            trustee_follow:this.ruleInfo.cz[1],
            ready_timeout_option:this.ruleInfo.zbcs.indexOf(true),
        },
            option:{
                ip_stop_cheat: this.ruleInfo.gn[0],
                gps_distance:gps,
                owner_kickout_player: this.ruleInfo.gn[2],
                block_hu_dong:this.ruleInfo.gn[3],
                block_join_when_gaming:this.ruleInfo.gn[4],
                request_dismiss:this.ruleInfo.gn[5],   
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
        cc.sys.localStorage.setItem("rule_zjh", JSON.stringify(this.ruleInfo));

    }

    public setAllGrey()
    {
        return
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

    public btn_baseScore(event, customEventData)
    {
        var type = parseInt(customEventData)
        var value = this.ruleInfo.df
        var idx = this.baseScoreList.indexOf(value)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.baseScoreList.length - 1)
                idx = this.baseScoreList.length - 1
        }
        this.ruleInfo.df = this.baseScoreList[idx]
        this.baseScore.string = this.baseScoreList[idx].toString();
        this.menScore.string = this.baseScore.string;
    }

    public btn_menScore(event, customEventData)
    {
        var type = parseInt(customEventData)
        var value = this.ruleInfo.mz
        var idx = this.baseScoreList.indexOf(value)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.baseScoreList.length - 1)
                idx = this.baseScoreList.length - 1
        }
        this.ruleInfo.mz = this.baseScoreList[idx]
        this.menScore.string = this.baseScoreList[idx].toString();
    }

    public btn_cmChanged1(event, customEventData)
    {
        var type = parseInt(customEventData)
        var value = this.ruleInfo.cm[1]
        var idx = this.cmTimes.indexOf(value)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.cmTimes.length - 1)
                idx = this.cmTimes.length - 1
        }
        this.ruleInfo.cm[1] = this.cmTimes[idx]
        this.labelChips1.string = this.cmTimes[idx].toString();
        // if (this.ruleInfo.cm[1] == 0 && this.ruleInfo.cm[2] == 0 && this.ruleInfo.cm[3] == 0)
        // {
        //     GameManager.getInstance().openWeakTipsUI("至少要有一个筹码不为0");
        //     this.ruleInfo.cm[1] = 1
        //     this.labelChips1.string = "1";
        // }    
    }

    public btn_cmChanged2(event, customEventData)
    {
        var type = parseInt(customEventData)
        var value = this.ruleInfo.cm[2]
        var idx = this.cmTimes.indexOf(value)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.cmTimes.length - 1)
                idx = this.cmTimes.length - 1
        }
        this.ruleInfo.cm[2] = this.cmTimes[idx]
        this.labelChips2.string = this.cmTimes[idx].toString();
        // if (this.ruleInfo.cm[1] == 0 && this.ruleInfo.cm[2] == 0 && this.ruleInfo.cm[3] == 0)
        // {
        //     GameManager.getInstance().openWeakTipsUI("至少要有一个筹码不为0");
        //     this.ruleInfo.cm[2] = 1
        //     this.labelChips2.string = "1";
        // }    
    }

    public btn_cmChanged3(event, customEventData)
    {
        var type = parseInt(customEventData)
        var value = this.ruleInfo.cm[3]
        var idx = this.cmTimes.indexOf(value)
        if (type == 0) // 减
        {
            idx -= 1
            if (idx < 0)
                idx = 0
        }
        else // 加
        {
            idx += 1
            if (idx > this.cmTimes.length - 1)
                idx = this.cmTimes.length - 1
        }
        this.ruleInfo.cm[3] = this.cmTimes[idx]
        this.labelChips3.string = this.cmTimes[idx].toString();
        // if (this.ruleInfo.cm[1] == 0 && this.ruleInfo.cm[2] == 0 && this.ruleInfo.cm[3] == 0)
        // {
        //     GameManager.getInstance().openWeakTipsUI("至少要有一个筹码不为0");
        //     this.ruleInfo.cm[3] = 1
        //     this.labelChips3.string = "1";
        // }   
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

    public btn_ls(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.ls.indexOf(true)
        this.ruleSelect(this.toggle_ls[originSelectIndex], false);
        this.ruleInfo.ls[originSelectIndex] =false
        this.ruleInfo.ls[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_ls[parseInt(customEventData)], true, true);
    }

    public btn_mp(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.mp.indexOf(true)
        this.ruleSelect(this.toggle_mp[originSelectIndex], false);
        this.ruleInfo.mp[originSelectIndex] =false
        this.ruleInfo.mp[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_mp[parseInt(customEventData)], true, true);
        this.toggle_wf[6].node.active = !this.ruleInfo.mp[0]
    }

    public btn_bp(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.bp.indexOf(true)
        this.ruleSelect(this.toggle_bp[originSelectIndex], false);
        this.ruleInfo.bp[originSelectIndex] =false
        this.ruleInfo.bp[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_bp[parseInt(customEventData)], true, true);
    }


    public btn_cs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.cs.indexOf(true)
        this.ruleSelect(this.toggle_cs[originSelectIndex], false);
        this.ruleInfo.cs[originSelectIndex] =false
        this.ruleInfo.cs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_cs[parseInt(customEventData)], true, true);
        if (this.ruleInfo.cs[0] != true)
            this.node.getChildByName("rule_cz").active = true
        else
            this.node.getChildByName("rule_cz").active = false
    }

    public btn_zbcs(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.zbcs.indexOf(true)
        this.ruleSelect(this.toggle_zbcs[originSelectIndex], false);
        this.ruleInfo.zbcs[originSelectIndex] =false
        this.ruleInfo.zbcs[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_zbcs[parseInt(customEventData)], true, true);
    }

    public btn_cz(event, customEventData)
    {
        var originSelectIndex = this.ruleInfo.cz.indexOf(true)
        this.ruleSelect(this.toggle_cz[originSelectIndex], false);
        this.ruleInfo.cz[originSelectIndex] =false
        this.ruleInfo.cz[parseInt(customEventData)] = true;
        this.ruleSelect(this.toggle_cz[parseInt(customEventData)], true, true);
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
