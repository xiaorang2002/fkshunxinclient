import { ClubRecordUI } from './../club/ClubRecordUI';
import { GameManager } from './../../../GameManager';
import { ShowRuleUI } from './../rule/ShowRuleUI';
import { GAME_TYPE, ConstValue, MJ_ACTION } from './../../../data/GameConstValue';
import { Utils } from "../../../../framework/Utils/Utils";
import { UIManager } from "../../../../framework/Manager/UIManager";
import { BaseUI } from "../../../../framework/UI/BaseUI";
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import ZjScoreDetailPage_UI from '../mj/ZjScoreDetailPage_UI';
import XzRoundOver_UI from '../mj/XzRoundOver_UI';
import ZgRoundOver_UI from '../mj/ZgRoundOver_UI';


const { ccclass, property } = cc._decorator;
@ccclass
export class PlayBackUI_MJ extends BaseUI {
    protected static className = "PlayBackUI_MJ";


    @property(cc.Node)
    nodeMid: cc.Node = null;
    @property(cc.Animation)
    nodeAnim: cc.Animation = null;
    @property([cc.SpriteFrame])
    chickSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    huanpaiSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    stageSp: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    shuiyin_spf: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    piaoSp: cc.SpriteFrame[] = [];

    private readonly effectPosList = [cc.v3(0, -125), cc.v3(292, 24), cc.v3(0, 174), cc.v3(-290, 24)] // 麻将pgh特效
    private readonly shuiYinMap = { 200: 0, 201: 1, 202: 2, 203: 3, 204: 4, 205: 5, 230: 6, 350: 7, 260: 8 }


    private gameRule = null;                // 游戏规则
    private zhuang = 0;
    private _playerInfoMap = new Map();      // 本局游戏数据
    private _playerCardMap = new Map();     // 本局玩家的牌node（手牌，桌牌，pgh牌）
    private playerNum = 0                   // 玩家人数
    private controlSeat = -1                // 当前轮到谁了
    private gameType = 0                   // 游戏类型
    private acitonTable = null              // 本局操作集合
    private curStep = 0;
    private playTime = null;
    private balanceInfo = null;
    private benji = null
    private curRound = null;
    private curHuNum = 0;                   // 当前胡的人数
    private cardNum = 0
    private speed = 1                       // 回放速度
    private handInitNum = 14
    private startTime = 0
    private roomId = 0

    private isPlay = null;
    private lastOutMj = 0;
    private lastOutSeat = 0;
    private addSize = 0
    private cardCache = new Map()
    private myId = 0
    private qghInfo = null
    private laiziValue = 0
    private luoBoPais = []

    onLoad() {

    }

    //时间刷新初始化
    initTime() {
        this.schedule(this.loop.bind(this), 0.25);
    }

    private loop() {
        //播放时间
        if (this.isPlay)
            this.playTime += 0.25;
        if (this.playTime >= this.speed) {
            this.playTime = 0;
            this.doActiton()
        }
    }

    public getRealSeatByRemoteSeat(seat) {
        var myInfo = this._playerInfoMap.get(0)
        var offset = myInfo.realSeat - myInfo.seat
        var otherRealSeat = (seat + offset + this.playerNum) % this.playerNum
        var seatMap = []
        if (this.playerNum == 2) // 2人坐0,2
            seatMap = [0, 2]
        else if (this.playerNum == 3) // 3人坐0,1,3号位
            seatMap = [0, 1, 3]
        else
            seatMap = [0, 1, 2, 3]
        return seatMap[otherRealSeat]
    }

    initView(type, info, playerId) {
        this.myId = playerId
        this.addSize = this.node.getContentSize().width - ConstValue.SCREEN_W
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + 0)
        this.qghInfo = null
        playerNode.getChildByName("stage").position = cc.v3(this.addSize / 2, -222)
        if (type == GAME_TYPE.YJMJ)
            this.laiziValue = 21 // 幺鸡麻将癞子是幺鸡
        if (type == GAME_TYPE.ZGMJ)
            this.laiziValue = 37 // 自贡麻将癞子是白板

        try {
            this.gameRule = info.rule;
            this.zhuang = info.zhuang
            this.playerNum = info.players.length
            this.curStep = 0;
            this.lastOutMj = 0;
            this.lastOutSeat = 0;
            this.gameType = type
            this.acitonTable = info.action_table
            this.playTime = 0;
            this.balanceInfo = info.balance;
            this.benji = info.ben_ji
            this.curRound = info.cur_round
            this.startTime = info.start_game_time
            this.roomId = info.table_id
            if (info.luoBoPais && info.luoBoPais.length > 0) {
                this.luoBoPais = [...info.luoBoPais]
            }
            if (type == GAME_TYPE.ZGMJ) {
                this.luoBoPais = info.luobo_tiles
            }
            this.initCardNum()

            this.updateMid()
            this.initPlayerInfo(info)
            this.initPlayerCard()
            this.updateTableView()
            this.initTime()
            this.setTopUI()
            this.initShuiYin()
            this.hideLuobo()
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true
            this.node.getChildByName("btn_over").active = false
            if (Utils.isXzmj(this.gameType)) // 血战麻将需要先换牌再定缺
            {
                if (info.rule.play.bao_jiao) { //有报听
                    this.setBaoTing()
                }

                if (info.rule.piao) { //有飘
                    this.setPiao()
                }

                if (info.huan_order >= 0) // 有换牌这个环节
                {
                    this.selectHuanPai(false)
                    this.doHpAction(info.huan_order)
                } 
                else
                    this.setDingQue()
            }
            else
                this.isPlay = true;
        }
        catch (e) {
            console.log(e)
        }

    }

    setTopUI() {
        this.node.getChildByName("label_room_id").getComponent(cc.Label).string = this.roomId.toString()
        this.node.getChildByName("label_time").getComponent(cc.Label).string = Utils.formatDate(this.startTime, 1)
    }

    setRound() {
        var list = [4, 8, 16]
        if (this.gameType == GAME_TYPE.ZGMJ) {
            list = [4, 6, 10, 16]
        }
        var ruleJuShu = list[this.gameRule.round.option];
        this.node.getChildByName("sp_round").active = true
        this.node.getChildByName("sp_round").getChildByName("label_round").getComponent(cc.Label).string = "第" + this.curRound + "/" + ruleJuShu + "局";
    }

    private initShuiYin() {
        var shuiYinIdx = this.shuiYinMap[this.gameType]
        if (typeof shuiYinIdx != "number")
            return
        this.node.getChildByName("shuiyin").getComponent(cc.Sprite).spriteFrame = this.shuiyin_spf[shuiYinIdx]
        this.node.getChildByName("shuiyin").active = true
    }

    initCardNum() {
        if (Utils.isXzmj(this.gameType)) {
            if (this.gameType == GAME_TYPE.FR2F) {
                if (this.gameRule.play.tile_count == 7) {
                    this.handInitNum = 8
                    this.cardNum = 44
                }
                else if (this.gameRule.play.tile_count == 10) {
                    this.handInitNum = 11
                    this.cardNum = 32
                }
                else
                    this.cardNum = 20
            }
            else if (this.gameType == GAME_TYPE.TR1F) {
                if (this.gameRule.play.tile_count == 7) {
                    this.handInitNum = 8
                    this.cardNum = 22
                }
                else
                    this.cardNum = 10
            }
            else if (this.gameType == GAME_TYPE.TR3F)
                this.cardNum = 82
            else if (this.gameType == GAME_TYPE.TR2F)
                this.cardNum = 46
            else if (this.gameType == GAME_TYPE.SR2F)
                this.cardNum = 33
            else if (this.gameType == GAME_TYPE.YJMJ) {
                if (this.playerNum == 2)
                    this.cardNum = 82
                else if (this.playerNum == 3)
                    this.cardNum = 69
                else
                    this.cardNum = 56
            }
            else if (this.gameType == GAME_TYPE.ZGMJ) {
                // 有癞子是76
                // 没有癞子是72
                this.cardNum = this.gameRule.play.exchange_tips ? 76 : 72
            }
            else
                this.cardNum = 56
        }
        else {
            if (this.playerNum == 2)
                this.cardNum = 42
            else if (this.playerNum == 3)
                this.cardNum = 69
            else
                this.cardNum = 56
        }
        this.cardNum -= 1
    }

    initPlayerInfo(info) {
        var isFind = false
        for (var idx = 0; idx < this.playerNum; idx++) {
            var playerInfo = info.players[idx]
            if (playerInfo.guid == this.myId)
                isFind = true
        }
        if (!isFind) // 没有找到自己的座位
            this.myId = info.players[0].guid

        for (let idx = 0; idx < this.playerNum; idx++) {
            let playerInfo = info.players[idx]
            if (playerInfo.guid == this.myId) {
                let finalMsg = {
                    isMen: false,
                    isTing: false,
                    realSeat: 0,
                    seat: idx + 1,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    isOnline: true,
                    isTrustee: false,
                    score: playerInfo.total_money,
                    inMj: playerInfo.start_pai.sort(function (a, b) { return a - b }),
                    outMj: [],
                    pgMj: [],
                    menMj: [],
                    selectHp: [],
                    receiveHp: [],
                    piaoScore: -1,
                    dqType: -1
                }
                if (playerInfo.huan) {
                    finalMsg.selectHp = playerInfo.huan.old
                    finalMsg.receiveHp = playerInfo.huan.new
                }
                if (playerInfo.que >= 0) {
                    finalMsg.dqType = playerInfo.que
                }
                if (playerInfo.piao >= 0) {
                    finalMsg.piaoScore = playerInfo.piao
                }
                this._playerInfoMap.set(0, finalMsg);
            }
        }
        for (let idx = 0; idx < this.playerNum; idx++) {
            let playerInfo = info.players[idx]
            if (playerInfo.guid != this.myId) {
                let realSeat = this.getRealSeatByRemoteSeat(idx + 1) as number
                let finalMsg = {
                    isMen: false,
                    isTing: false,
                    realSeat: realSeat,
                    seat: idx + 1,
                    id: playerInfo.guid,
                    name: playerInfo.nickname,
                    head: playerInfo.head_url,
                    sex: playerInfo.sex,
                    isZhuang: false,
                    isOnline: true,
                    isTrustee: false,
                    score: playerInfo.total_money,
                    inMj: playerInfo.start_pai.sort(function (a, b) { return a - b }),
                    outMj: [],
                    pgMj: [],
                    menMj: [],
                    selectHp: [],
                    receiveHp: [],
                    dqType: -1,
                    piaoScore: -1,
                }
                if (playerInfo.huan) {
                    finalMsg.selectHp = playerInfo.huan.old
                    finalMsg.receiveHp = playerInfo.huan.new
                }
                if (playerInfo.que >= 0) {
                    finalMsg.dqType = playerInfo.que
                }
                if (playerInfo.piao >= 0) {
                    finalMsg.piaoScore = playerInfo.piao
                }
                this._playerInfoMap.set(realSeat, finalMsg);
            }
        }
        this._playerInfoMap.forEach((infoObj, seat) => {
            var playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
            var spHead = playerNode.getChildByName("sp").getComponent(cc.Sprite)
            Utils.loadTextureFromNet(spHead, infoObj.head)
            playerNode.getChildByName("label_name").getComponent(cc.Label).string = infoObj.name
            playerNode.getChildByName("score").getComponent(cc.Label).string = (infoObj.score / 100).toString()
            this.setZhuang(seat)
            this.setMen(seat)
            this.setTing(seat)
            playerNode.active = true

        })
    }

    private initPlayerCard() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            var handMjNodeArry = []
            var handMjPosArry = []
            var outMjNodeArry = []
            var menMjNodeArry = []
            var pgMjArray = []
            var playerNode = this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat)
            if (seat == 0) {
                // 动态克隆手牌
                var inFirstMjNode = playerNode.getChildByName("mj_in").getChildByName("mj_0");
                var inMjParent = inFirstMjNode.parent
                if (this.handInitNum == 8) // 7张牌和10张牌的手牌节点需要调整
                    inFirstMjNode.x = 315.5
                else if (this.handInitNum == 11)
                    inFirstMjNode.x = 191
                var space = 80
                inFirstMjNode.scale = 1.15
                space = 92
                if (this.addSize >= 160) {
                    inFirstMjNode.scale = 1.2
                    space = 97
                }
                if (this.addSize >= 200) {
                    inFirstMjNode.x += (this.addSize - 190) / 2
                }
                var inFirstMjPos = inFirstMjNode.position
                handMjNodeArry.push(inFirstMjNode);
                handMjPosArry.push(inFirstMjPos);
                for (var num = 1; num < this.handInitNum; ++num) {
                    //手牌初始化
                    var inMjNode = cc.instantiate(inFirstMjNode)
                    var pos = cc.v3(inFirstMjNode.x + num * space, 0)
                    if (num == this.handInitNum - 1) {
                        var pos = cc.v3(num * space + inFirstMjNode.x + 39, 0)
                    }
                    inMjNode.parent = inMjParent
                    handMjNodeArry.push(inMjNode);
                    handMjPosArry.push(pos);
                }

                // 动态克隆出的牌
                var outFirstMjNode = playerNode.getChildByName("mj_out").getChildByName("mj_0");
                var outMjParent = outFirstMjNode.parent
                var outFirstMjPos = outFirstMjNode.position
                for (var num = 0; num < 42; ++num) {
                    //出牌初始化
                    var outMjNode = cc.instantiate(outFirstMjNode)
                    outMjNode.zIndex = 44 - num
                    if (num < 11)
                        outMjNode.setPosition(outFirstMjPos.x + num * 51, outFirstMjPos.y);
                    else if (num < 22)
                        outMjNode.setPosition(outFirstMjPos.x + (num - 11) * 51, outFirstMjPos.y + 62);
                    else if (num < 33) {
                        outMjNode.zIndex += 1.5 * num
                        outMjNode.setPosition(outFirstMjPos.x + (num - 22) * 51, outFirstMjPos.y + 13);
                    }
                    else if (num < 44) {
                        outMjNode.zIndex += 1.2 * num
                        outMjNode.setPosition(outFirstMjPos.x + (num - 33) * 51, outFirstMjPos.y + 75);
                    }
                    outMjNode.parent = outMjParent
                    outMjNodeArry.push(outMjNode);
                }

                // 碰杠牌初始化rcmd
                for (var k = 0; k < 4; ++k) {
                    var mjnode = playerNode.getChildByName("mj_pg").getChildByName("pg" + k);
                    if (this.addSize >= 160)
                        mjnode.x += k * 20
                    pgMjArray.push(mjnode);
                }

                var menFirstMjNode = playerNode.getChildByName("mj_men").getChildByName("mj_0");
                var menMjParent = menFirstMjNode.parent
                var menFirstMjPos = menFirstMjNode.position
                for (var num = 0; num < 13; ++num) {
                    var menMjNode = cc.instantiate(menFirstMjNode)
                    menMjNode.setPosition(menFirstMjPos.x - num * 38, menFirstMjPos.y);
                    menMjNode.parent = menMjParent
                    menMjNodeArry.push(menMjNode);
                }

            }
            else {
                // 动态克隆手牌
                var inFirstMjNode = playerNode.getChildByName("mj_in").getChildByName("mj_0");
                var inMjParent = inFirstMjNode.parent
                var inFirstMjPos = inFirstMjNode.position
                for (var num = 0; num < 14; ++num) {
                    //手牌初始化
                    var inMjNode = cc.instantiate(inFirstMjNode)
                    if (num == 13) {
                        if (seat == 2)
                            inMjNode.setPosition(inFirstMjPos.x - num * 41 - 20, inFirstMjPos.y);
                        else if (seat == 1)
                            inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y + num * 34 + 21);
                        else
                            inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y - num * 34 - 22);
                    }
                    else {
                        if (seat == 2)
                            inMjNode.setPosition(inFirstMjPos.x - num * 41, inFirstMjPos.y);
                        else if (seat == 1) {
                            inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y + num * 34);
                            inMjNode.zIndex = 13 - num
                        }
                        else
                            inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y - num * 34);
                    }
                    inMjNode.parent = inMjParent
                    handMjNodeArry.push(inMjNode);
                    handMjPosArry.push(inMjNode.position);
                }

                // // 动态克隆出的牌
                var outFirstMjNode = playerNode.getChildByName("mj_out").getChildByName("mj_0");
                var outMjParent = outFirstMjNode.parent
                var outFirstMjPos = outFirstMjNode.position
                var numCount = 30
                if (seat == 2)
                    numCount = 42
                for (var num = 0; num < numCount; ++num) {
                    //出牌初始化
                    var outMjNode = cc.instantiate(outFirstMjNode)
                    if (seat == 2) {
                        outMjNode.zIndex = num
                        if (num < 11) {
                            outMjNode.setPosition(outFirstMjPos.x - num * 51, outFirstMjPos.y);
                        }
                        else if (num < 22) {
                            outMjNode.setPosition(outFirstMjPos.x - (num - 11) * 51, outFirstMjPos.y - 57);
                        }
                        else if (num < 33) {
                            outMjNode.setPosition(outFirstMjPos.x - (num - 22) * 51, outFirstMjPos.y + 16);
                        }
                        else if (num < 44) {
                            outMjNode.setPosition(outFirstMjPos.x - (num - 33) * 51, outFirstMjPos.y - 41);
                        }
                    }
                    else if (seat == 1) {
                        if (num < 11) {
                            outMjNode.zIndex = 33 - num
                            outMjNode.setPosition(outFirstMjPos.x, outFirstMjPos.y + 39 * num);
                        }
                        else if (num < 22) {
                            outMjNode.zIndex = 22 - num
                            outMjNode.setPosition(outFirstMjPos.x - 56, outFirstMjPos.y + 39 * (num - 11));
                        }
                        else {
                            outMjNode.zIndex = 11 - num
                            outMjNode.setPosition(outFirstMjPos.x, (outFirstMjPos.y + 9) + 39 * (num - 22));
                        }

                    }
                    else {
                        if (num < 11)
                            outMjNode.setPosition(outFirstMjPos.x, outFirstMjPos.y - 39 * num);
                        else if (num < 22)
                            outMjNode.setPosition(outFirstMjPos.x + 57, outFirstMjPos.y - 39 * (num - 11));
                        else
                            outMjNode.setPosition(outFirstMjPos.x, outFirstMjPos.y + 9 - 39 * (num - 22));

                    }
                    outMjNode.parent = outMjParent
                    outMjNodeArry.push(outMjNode);
                }
                for (var k = 0; k < 4; ++k) {
                    //碰杠牌初始化
                    var mjnode = playerNode.getChildByName("mj_pg").getChildByName("pg" + k);
                    pgMjArray.push(mjnode);
                }

                var menFirstMjNode = playerNode.getChildByName("mj_men").getChildByName("mj_0");
                var menMjParent = menFirstMjNode.parent
                var menFirstMjPos = menFirstMjNode.position
                for (var num = 0; num < 13; ++num) {
                    var menMjNode = cc.instantiate(menFirstMjNode)
                    if (seat == 1)
                        menMjNode.setPosition(menFirstMjPos.x, menFirstMjPos.y - num * 30);
                    else if (seat == 2)
                        menMjNode.setPosition(menFirstMjPos.x + num * 38, menFirstMjPos.y);
                    else {
                        menMjNode.zIndex = 15 - num
                        menMjNode.setPosition(menFirstMjPos.x, menFirstMjPos.y + num * 30);
                    }
                    menMjNode.parent = menMjParent
                    menMjNodeArry.push(menMjNode);
                }

            }
            var info = {
                mjInArray: handMjNodeArry,
                mjOutArray: outMjNodeArry,
                mjPgArray: pgMjArray,
                mjPosArray: handMjPosArry,
                mjMenArry: menMjNodeArry,
            }
            this._playerCardMap.set(seat, info)
        })
    }

    private updateTableView() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            this.handMjChange(seat);
        })
    }

    //设置是否听牌
    setTing(realSeat) {
        var tingNode = this.node.getChildByName("player_info").getChildByName("player" + realSeat).getChildByName("Layout").getChildByName("sp_ting")
        tingNode.active = this._playerInfoMap.get(realSeat).isTing;
    }

    setMen(realSeat) {
        var tingNode = this.node.getChildByName("player_info").getChildByName("player" + realSeat).getChildByName("Layout").getChildByName("sp_men_bg")
        tingNode.active = this._playerInfoMap.get(realSeat).isMen;
    }

    setCardNum() {
        this.node.getChildByName("sp_card_num").active = true
        this.node.getChildByName("sp_card_num").getChildByName("label_card_num").getComponent(cc.Label).string = "剩 " + this.cardNum + " 张";
    }

    /**玩家是否在线 */
    public setPlayerOnline(seat) {
        var onlineNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("online")
        onlineNode.active = !this._playerInfoMap.get(seat).isOnline;
    }

    public setTrustee(seat) {
        var tuoguanNode = this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("tuoguanTip")
        tuoguanNode.active = this._playerInfoMap.get(seat).isTrustee;
    }

    public onActionWait(seat, actionMap) {
        if (actionMap.size == 0) {
            this.node.getChildByName("game_button_" + seat).active = false;
            return
        }
        var count = 1;
        if (actionMap.get(MJ_ACTION.ACTION_TING)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_ting").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_ting").active = false;


        if (actionMap.get(MJ_ACTION.ACTION_PENG) || actionMap.get(MJ_ACTION.ACTION_RUAN_PENG)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_peng").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_peng").active = false;

        if (actionMap.get(MJ_ACTION.ACTION_AN_GANG) || actionMap.get(MJ_ACTION.ACTION_MING_GANG) || actionMap.get(MJ_ACTION.ACTION_BA_GANG)
            || actionMap.get(MJ_ACTION.ACTION_FREE_BA_GANG) || actionMap.get(MJ_ACTION.ACTION_FREE_AN_GANG)
            || actionMap.get(MJ_ACTION.ACTION_RUAN_AN_GANG) || actionMap.get(MJ_ACTION.ACTION_RUAN_MING_GANG)
            || actionMap.get(MJ_ACTION.ACTION_RUAN_BA_GANG)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_gang").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_gang").active = false;

        if (actionMap.get(MJ_ACTION.ACTION_HU) || actionMap.get(MJ_ACTION.ACTION_ZI_MO) || actionMap.get(MJ_ACTION.ACTION_QIANG_GANG_HU)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_hu").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_hu").active = false;

        if (actionMap.get(MJ_ACTION.ACTION_MEN) || actionMap.get(MJ_ACTION.ACTION_MEN_ZI_MO)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_men").active = true;
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_men").active = false;
        if (actionMap.get(MJ_ACTION.ACTION_GANG_HUAN_PAI)) {
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_huan").active = true;
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_huan").position = cc.v3(-220 * count, 0);
            count += 1;
        }
        else
            this.node.getChildByName("game_button_" + seat).getChildByName("btn_huan").active = false;
        this.node.getChildByName("game_button_" + seat).active = true;
    }

    public clearWaitView() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            this.node.getChildByName("game_button_" + seat).active = false;
        })
    }

    // 设置定缺
    setDingQue() {
        if (this._playerInfoMap.get(0).dqType < 0) // 没有定缺这个环节
        {
            this._playerInfoMap.forEach((infoObj, seat) => {
                this.isPlay = true
                for (var i = 0; i < this._playerCardMap.get(seat).mjInArray.length; i++) {
                    this._playerCardMap.get(seat).mjInArray[i].getChildByName("gray").active = false
                }
            })
        }
        else {
            this._playerInfoMap.forEach((infoObj, seat) => {
                var type = this._playerInfoMap.get(seat).dqType
                var str = ""
                if (type == 0)
                    str = "sp_wan"
                else if (type == 1)
                    str = "sp_tong"
                else if (type == 2)
                    str = "sp_tiao"
                else // 没有type
                {
                    this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_wan").active = false
                    this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_tong").active = false
                    this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("Layout").getChildByName("sp_tiao").active = false
                    return
                }
                this.node.getChildByName("player_info").getChildByName("player" + seat).getChildByName("Layout").getChildByName(str).active = true
                this.updateMjColorByType(seat)
                infoObj.inMj = Utils.sortHandCardByQue(type, infoObj.inMj, this.gameType)
            })
            this.isPlay = true // 定缺完成后开始打牌
        }
    }

    // 设置飘
    setPiao() {
        if (this.gameRule.piao.piao_option != undefined) {
            this._playerInfoMap.forEach((infoObj, seat) => {
                let score = infoObj.piaoScore
                let playerInfoNode = this.node.getChildByName("player_info")
                if (score <= 0) {
                    playerInfoNode.getChildByName("player" + seat).getChildByName("sp_piao").active = false
                } else {
                    playerInfoNode.getChildByName("player" + seat).getChildByName("sp_piao").active = true
                }
            })
        }
        this.isPlay = true // 飘分完成后开始打牌
    }
    setBaoTing() {
        // this._playerInfoMap.forEach((infoObj, seat) => {
        //     let playerInfoNode = this.node.getChildByName("player_info")
        //     playerInfoNode.getChildByName("player" + seat).getChildByName("sp_baoTing").active = infoObj.baoTingResult
        // })
        let playerInfoNode = this.node.getChildByName("player_info")
        for (let balanceDetail of this.balanceInfo) {
            let seat = this.getRealSeatByRemoteSeat(balanceDetail.chair_id);
            let playerNode = playerInfoNode.getChildByName("player" + seat)
            //报
            if (balanceDetail.baoting != undefined && balanceDetail.baoting) {
                playerNode.getChildByName("sp_baoTing").active = true
            } else {
                playerNode.getChildByName("sp_baoTing").active = false
            }
        }
        this.isPlay = true // 报听完成后开始打牌
    }
    setZhuang(realSeat) {
        var masterNode = this.node.getChildByName("player_info").getChildByName("player" + realSeat).getChildByName("sp_master_bg")
        masterNode.active = this.zhuang == this._playerInfoMap.get(realSeat).seat
        if (masterNode.active)
            this._playerInfoMap.get(realSeat).isZhuang = true
    }

    //刷新手牌麻将的显示(整体刷新)
    handMjChange(realSeat) {
        this.controlSeat = realSeat
        var playerObj = this._playerInfoMap.get(realSeat)
        playerObj.inMj = Utils.sortHandCardByQue(playerObj.dqType, playerObj.inMj, this.gameType)
        var mjarray = playerObj.inMj;
        //出牌状态,数组合法性检测
        if (mjarray.length % 3 === 0) {
            console.log("麻将手牌数量异常，数量为：" + mjarray.length);
            return;
        }
        var cardNum = 14
        var hidenum = (4 - Math.floor(mjarray.length / 3)) * 3;
        if (realSeat == 0) {
            cardNum = this.handInitNum
            var hidenum = this._playerInfoMap.get(realSeat).pgMj.length * 3
        }
        for (var i = 0; i < this._playerCardMap.get(realSeat).mjInArray.length; ++i) {
            if (i < hidenum || (mjarray.length % 3 === 1 && i === cardNum - 1)) {
                this._playerCardMap.get(realSeat).mjInArray[i].active = false;
                this._playerCardMap.get(realSeat).mjInArray[i].getChildByName("laizi").active = false;
            }
            else {
                this._playerCardMap.get(realSeat).mjInArray[i].active = true;
                this._playerCardMap.get(realSeat).mjInArray[i].position = this._playerCardMap.get(realSeat).mjPosArray[i];
                this._playerCardMap.get(realSeat).mjInArray[i].getChildByName("laizi").active = false;
                if (mjarray[i - hidenum] == this.laiziValue)
                    this._playerCardMap.get(realSeat).mjInArray[i].getChildByName("laizi").active = true;
                this.setMjTexture(realSeat, this._playerCardMap.get(realSeat).mjInArray[i], mjarray[i - hidenum], 0);
            }
        }
    }
    //刷新出牌显示(整体刷新)
    outMjChange(realSeat) {
        var outarray = this._playerInfoMap.get(realSeat).outMj;

        //需要隐藏和显示的牌
        for (var i = 0; i < this._playerCardMap.get(realSeat).mjOutArray.length; ++i) {
            if (i < outarray.length)
                this.setMjTexture(realSeat, this._playerCardMap.get(realSeat).mjOutArray[i], outarray[i], 1);
            else
                this._playerCardMap.get(realSeat).mjOutArray[i].active = false;
        }
    }

    //刷新碰杠显示(整体刷新)
    pgMjChange(realSeat) {
        var pgarray = this._playerInfoMap.get(realSeat).pgMj;
        for (var i = 0; i < 4; ++i) {
            if (i < pgarray.length) {
                this._playerCardMap.get(realSeat).mjPgArray[i].active = true;
                for (var j = 0; j < pgarray[i].length; ++j) {
                    //前3位先显示
                    if (j < 4) {
                        var mjnode = this._playerCardMap.get(realSeat).mjPgArray[i].getChildByName("mj_" + j);
                        var cardId = pgarray[i][j]
                        if ((pgarray[i][5] == 15 || pgarray[i][5] == 6) && j == 3)
                            cardId = 0
                        mjnode.getChildByName("laizi").active = false
                        if (cardId == this.laiziValue)
                            mjnode.getChildByName("laizi").active = true
                        this.setMjTexture(realSeat, mjnode, cardId, 2);
                    }

                }
            }
            else
                this._playerCardMap.get(realSeat).mjPgArray[i].active = false;
        }
    }

    menArrayChange(realSeat) {
        var menarray = this._playerInfoMap.get(realSeat).menMj;
        for (var i = 0; i < this._playerCardMap.get(realSeat).mjMenArry.length; ++i) {
            if (i < menarray.length)
                this.setMjTexture(realSeat, this._playerCardMap.get(realSeat).mjMenArry[i], menarray[i], 1);
            else
                this._playerCardMap.get(realSeat).mjMenArry[i].active = false;
        }
    }


    //移除对应手牌
    removeHandMj(handmj, mjid) {
        for (var i = 0; i < handmj.length; ++i) {
            if (handmj[i] == mjid) {
                handmj.splice(i, 1);
                break;
            }
        }
        handmj.sort(function (a, b) { return a - b });
    }

    //寻找碰牌中是否有能杠的牌
    checkAnGang(handmj, mjid) {
        for (var i = 0; i < handmj.length - 1; ++i) {
            if (handmj[i] == mjid)
                return true;
        }
        return false;
    }

    private updateMid() {
        let children = this.nodeMid.getChildByName("sp_mid_bg").children;
        for (let i = 0; i < children.length; i++) {
            children[i].active = false;
        }
        if (this.controlSeat < 0)
            return
        var midChildNode = this.nodeMid.getChildByName("sp_mid_bg").getChildByName("sp_" + this.controlSeat)
        midChildNode.active = true;
        midChildNode.stopAllActions();
        var action = cc.repeatForever(cc.blink(1, 1))
        midChildNode.runAction(action)
    }

    /**动画改变 */
    onAnimationPlay(seat, actionType) {
        this.nodeAnim.node.position = this.effectPosList[seat]
        this.nodeAnim.node.active = true;
        var effect = ["hu", "peng", "gang", "ting", "dianpao", "men"];
        this.nodeAnim.play(effect[actionType]);
        this.nodeAnim.on("finished", this.callBack, this)
    }

    private callBack() {
        this.nodeAnim.node.stopAllActions()
        this.nodeAnim.node.active = false;
    }

    private soundChange(seat, actionType) {
        if (this._playerInfoMap.get(seat).sex == 1) {
            AudioManager.getInstance().playSFX("man/" + actionType)
        }
        else {
            AudioManager.getInstance().playSFX("woman/" + actionType)
        }
    }

    private openZgRoundOverUI() {
        UIManager.getInstance().openUI(ZgRoundOver_UI, 32, () => {
            UIManager.getInstance().getUI(ZgRoundOver_UI).getComponent("ZgRoundOver_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime, this.luoBoPais);

        })
    }

    //显示萝卜牌的麻将值
    private showLuoBoPai(mapais) {
        let luoBo_pai = this.node.getChildByName("luobo")
        luoBo_pai.active = true
        for (let i = 0; i < mapais.length; ++i) {
            let mjNode = luoBo_pai.getChildByName("mj_" + i)
            if (mapais[i].pai > 0) {
                Utils.loadTextureFromLocal(mjNode.getChildByName("sp").getComponent(cc.Sprite),
                    "/card_mj/mj_" + mapais[i].pai, function () { mjNode.active = true; });
            }
            else {
                mjNode.active = false;
            }
        }

    }

    //显示的萝卜个数
    private showLuoBoValue() {

        var oRule = this.gameRule
        let isUnion = false
        if (oRule.union) {
            isUnion = true
        }

        for (var balanceDetail of this.balanceInfo) {
            let seat = this.getRealSeatByRemoteSeat(balanceDetail.chair_id);
            if (seat == 0) {
                let score = balanceDetail.roundScore
                if (isUnion) {
                    score = balanceDetail.roundMoney
                }
                if (score < 0) {

                } else {
                    let luobo = this.node.getChildByName("node_cardsMgr").getChildByName("player" + seat).getChildByName("luobo")
                    luobo.active = true
                    luobo.getChildByName("label").getComponent(cc.Label).string = "bx" + balanceDetail.luobo_count
                    luobo.runAction(cc.blink(0.2, 1))
                }

            }

        }
    }

    private hideLuobo() {
        let luoBo_pai = this.node.getChildByName("luobo")
        luoBo_pai.active = true
        for (let i = 0; i < 2; ++i) {
            let mjNode = luoBo_pai.getChildByName("mj_" + i)
            mjNode.active = false;
        }
        luoBo_pai.active = false
        for (let i = 0; i < 4; i++) {
            this.node.getChildByName("node_cardsMgr").getChildByName("player" + i).getChildByName("luobo").active = false
        }

    }


    private doActiton() {
        if (!this.isPlay)
            return
        this.clearWaitView()
        if (this.acitonTable.length < this.curStep + 1) {
            this.unscheduleAllCallbacks()
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = false
            this.node.getChildByName("playback_left").active = false
            this.node.getChildByName("playback_right").active = false
            this.node.getChildByName("label_speed").active = false
            this.node.getChildByName("btn_over").active = true
            if (this.gameType == GAME_TYPE.LFMJ || this.gameType == GAME_TYPE.MHXL) {
                UIManager.getInstance().openUI(ZjScoreDetailPage_UI, 32, () => {
                    UIManager.getInstance().getUI(ZjScoreDetailPage_UI).getComponent("ZjScoreDetailPage_UI").playBackInitView(this.gameType, this.balanceInfo, this._playerInfoMap, this.benji);
                })
            }
            else if (this.gameType == GAME_TYPE.ZGMJ) {
                if (this.luoBoPais.length > 0) {
                    let luoBo_pai = this.node.getChildByName("luobo")
                    luoBo_pai.active = true
                    luoBo_pai.scaleX = 0
                    luoBo_pai.runAction(cc.scaleTo(0.1, 1, 1))
                    this.node.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(() => {
                        this.showLuoBoPai(this.luoBoPais)
                        this.showLuoBoValue()
                    }), cc.delayTime(3), cc.callFunc(() => {
                        this.hideLuobo();
                        this.openZgRoundOverUI()
                    })))
                } else {
                    this.openZgRoundOverUI()
                }

            }
            else if (Utils.isXzmj(this.gameType)) {
                UIManager.getInstance().openUI(XzRoundOver_UI, 32, () => {
                    UIManager.getInstance().getUI(XzRoundOver_UI).getComponent("XzRoundOver_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime);

                })
            }

            return
        }
        var actionInfo = this.acitonTable[this.curStep]
        if (actionInfo.act == "Draw") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this.controlSeat = seat
            this._playerInfoMap.get(seat).inMj.push(actionInfo.msg.tile);
            this.handMjChange(seat);
            this.updateMid()
            if (this.curStep == 0) // 首次刚摸牌刷新所有人
            {
                this._playerInfoMap.forEach((infoObj, tempSeat) => {
                    this.updateMjColorByType(tempSeat) // 每一次摸牌需要刷新颜色
                })
            }
            else
                this.updateMjColorByType(seat) // 每一次摸牌需要刷新颜色
            this.cardNum -= 1
            this.setCardNum()
        }
        else if (actionInfo.act == "Discard") {
            this.lastOutMj = actionInfo.msg.tile;
            //出牌
            this.lastOutSeat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(this.lastOutSeat).outMj.push(this.lastOutMj);
            this.removeHandMj(this._playerInfoMap.get(this.lastOutSeat).inMj, this.lastOutMj);
            this.handMjChange(this.lastOutSeat)
            this.outMjChange(this.lastOutSeat)
            this.updateMjColorByType(this.lastOutSeat) // 出玩牌后刷新上家变灰
            if (this._playerInfoMap.get(this.lastOutSeat).sex == 1) {
                AudioManager.getInstance().playSFX("man/sound_mj_" + this.lastOutMj)
            }
            else {
                AudioManager.getInstance().playSFX("woman/sound_mj_" + this.lastOutMj)
            }
            AudioManager.getInstance().playSFX("outmj")
        }
        else if (actionInfo.act == "Peng") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            //碰牌方加入碰牌
            var peng = [mjid, mjid, mjid, -1, seat, 1];
            this._playerInfoMap.get(seat).pgMj.push(peng);
            //碰牌方删除手牌
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.handMjChange(seat);

            //出牌方删除出牌
            this._playerInfoMap.get(this.lastOutSeat).outMj.pop();
            this.outMjChange(this.lastOutSeat)


            this.pgMjChange(seat);
            this.soundChange(seat, "peng");
            this.onAnimationPlay(seat, 1);
        }

        else if (actionInfo.act == "AnGang") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            //暗杠
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            var peng = [mjid, mjid, mjid, mjid, seat, 6];
            this._playerInfoMap.get(seat).pgMj.push(peng);
            this.handMjChange(seat);
            this.pgMjChange(seat);
            this.soundChange(seat, "gang");
            this.onAnimationPlay(seat, 2);

        }

        else if (actionInfo.act == "MingGang") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            //直杠
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.handMjChange(seat);
            var peng = [mjid, mjid, mjid, mjid, seat, 2];
            this._playerInfoMap.get(seat).pgMj.push(peng);
            this.pgMjChange(seat);
            this._playerInfoMap.get(this.lastOutSeat).outMj.pop();
            this.outMjChange(this.lastOutSeat);
            this.soundChange(seat, "gang");
            this.onAnimationPlay(seat, 2);

        }
        else if (actionInfo.act == "BaGang" || actionInfo.act == "FreeBaGang") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            if (actionInfo.failed) {
                this.qghInfo = { poutSeat: seat, mjid: mjid } // 记录被抢杠导致扒杠失败的牌
            }
            else {
                //补杠
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
                for (var i = 0; i < this._playerInfoMap.get(seat).pgMj.length; ++i) {
                    if (this._playerInfoMap.get(seat).pgMj[i][0] == mjid) {
                        this._playerInfoMap.get(seat).pgMj[i][3] = mjid;
                        this._playerInfoMap.get(seat).pgMj[i][5] = 5;
                    }

                }
                this.handMjChange(seat);
                this.pgMjChange(seat);
                this.soundChange(seat, "gang");
                this.onAnimationPlay(seat, 2);
            }
        }

        //todo 添加软碰，软杠等act
        else if (actionInfo.act == "RuanPeng") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            var substituteNum = actionInfo.msg.substitute_num
            var peng = []
            for (var i = 0; i < substituteNum; i++) {
                peng.push(this.laiziValue)
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, this.laiziValue);
            }
            for (var i = 0; i < 2 - substituteNum; i++) {
                peng.push(mjid)
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            }
            peng.push(mjid)
            peng.push(-1)
            peng.push(seat)
            peng.push(13)
            this._playerInfoMap.get(seat).pgMj.push(peng);
            this.handMjChange(seat);

            //出牌方删除出牌
            this._playerInfoMap.get(this.lastOutSeat).outMj.pop();
            this.outMjChange(this.lastOutSeat)

            this.pgMjChange(seat);
            this.soundChange(seat, "peng");
            this.onAnimationPlay(seat, 1);
        }
        else if (actionInfo.act == "RuanMingGang") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            var substituteNum = actionInfo.msg.substitute_num
            var gang = []
            for (var i = 0; i < substituteNum; i++) {
                gang.push(this.laiziValue)
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, this.laiziValue);
            }
            for (var i = 0; i < 3 - substituteNum; i++) {
                gang.push(mjid)
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            }
            gang.push(mjid)
            gang.push(seat)
            gang.push(14)
            this._playerInfoMap.get(seat).pgMj.push(gang);
            this.handMjChange(seat);
            this.pgMjChange(seat);
            //出牌方删除出牌
            this._playerInfoMap.get(this.lastOutSeat).outMj.pop();
            this.outMjChange(this.lastOutSeat)
            this.soundChange(seat, "gang");
            this.onAnimationPlay(seat, 2);
        }
        else if (actionInfo.act == "RuanAnGang") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            var substituteNum = actionInfo.msg.substitute_num
            var gang = []
            for (var i = 0; i < substituteNum; i++) {
                gang.push(this.laiziValue)
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, this.laiziValue);
            }
            for (var i = 0; i < 4 - substituteNum; i++) {
                gang.push(mjid)
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            }
            gang.push(seat)
            gang.push(15)
            this._playerInfoMap.get(seat).pgMj.push(gang);
            this.handMjChange(seat);
            this.pgMjChange(seat);
            this.soundChange(seat, "gang");
            this.onAnimationPlay(seat, 2);

        }

        else if (actionInfo.act == "RuanBaGang") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            var substituteNum = actionInfo.msg.substitute_num
            if (substituteNum > 0)
                mjid = this.laiziValue
            if (actionInfo.failed) {
                this.qghInfo = { poutSeat: seat, mjid: mjid } // 记录被抢杠导致扒杠失败的牌
            }
            else {
                //补杠
                this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
                for (var i = 0; i < this._playerInfoMap.get(seat).pgMj.length; ++i) {
                    if (this._playerInfoMap.get(seat).pgMj[i][2] == actionInfo.msg.tile) {
                        var result = [];
                        for (var j = 0; j < 3; j++) {
                            if (this._playerInfoMap.get(seat).pgMj[i][j] == this.laiziValue)
                                result.push(this.laiziValue)
                        }
                        result.push(mjid)
                        var lastNum = 4 - result.length
                        for (var k = 0; k < lastNum; k++)
                            result.push(actionInfo.msg.tile)
                        result.push(this._playerInfoMap.get(seat).pgMj[i][4])
                        result.push(16)
                        this._playerInfoMap.get(seat).pgMj[i] = result;
                    }

                }
                this.handMjChange(seat);
                this.pgMjChange(seat);
                this.soundChange(seat, "gang");
                this.onAnimationPlay(seat, 2);
            }
        }
        else if (actionInfo.act == "GangHuanPai") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var length = this._playerInfoMap.get(seat).inMj.length
            this._playerInfoMap.get(seat).inMj[length - 1] = this.laiziValue
            for (var i = 0; i < this._playerInfoMap.get(seat).pgMj.length; ++i) {
                if (this._playerInfoMap.get(seat).pgMj[i][3] === mjid) {
                    for (var j = 3; j >= 0; j--) {
                        if (this._playerInfoMap.get(seat).pgMj[i][j] == this.laiziValue) {
                            this._playerInfoMap.get(seat).pgMj[i][j] = mjid
                            break
                        }
                    }
                }
            }
            this.handMjChange(seat);
            this.pgMjChange(seat);
        }
        else if (actionInfo.act == "QiangGangHu") {
            var dianPaoSeat = -1
            if (this.qghInfo) {
                this.removeHandMj(this._playerInfoMap.get(this.qghInfo.poutSeat).inMj, this.qghInfo.mjid);
                dianPaoSeat = this.qghInfo.poutSeat
            }
            else {
                this._playerInfoMap.forEach((infoObj, seat) => {
                    if (infoObj.inMj.length % 3 == 2) {
                        dianPaoSeat = seat
                        // this.removeHandMj(this._playerInfoMap.get(dianPaoSeat).inMj, this.qghInfo.mjid);
                    }
                })
            }
            this.curHuNum += 1
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this.soundChange(seat, "hu");
            this.onAnimationPlay(seat, 0);
            this.onAnimationPlay(dianPaoSeat, 4);
            this.setStage(seat, 1)
            var huMjId = actionInfo.msg.tile
            this._playerInfoMap.get(seat).inMj.push(huMjId)
            this.handMjChange(seat);
            this.updateMjColorByType(seat)
            this.handMjChange(dianPaoSeat);
            this.qghInfo = null
        }

        else if (actionInfo.act == "Hu") {
            this.curHuNum += 1
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this.soundChange(seat, "hu");
            this.onAnimationPlay(seat, 0);
            this.onAnimationPlay(this.lastOutSeat, 4);
            this.setStage(seat, 1)
            var huMjId = actionInfo.msg.tile
            var poutOutCardLength = this._playerInfoMap.get(this.lastOutSeat).outMj.length
            if (poutOutCardLength > 0 && this._playerInfoMap.get(this.lastOutSeat).outMj[poutOutCardLength - 1] == huMjId)
                this._playerInfoMap.get(this.lastOutSeat).outMj.pop(); // 移除
            this._playerInfoMap.get(seat).inMj.push(huMjId)
            this.handMjChange(seat);
            this.updateMjColorByType(seat)
            this.outMjChange(this.lastOutSeat)
        }
        else if (actionInfo.act == "ZiMo") {
            this.curHuNum += 1
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this.soundChange(seat, "zimo");
            this.onAnimationPlay(seat, 0);
            this.setStage(seat, 2)
        }
        else if (actionInfo.act == "Ting") {
            //听
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isTing = true;
            var mjid = actionInfo.msg.tile
            this.soundChange(seat, "ting");
            this.onAnimationPlay(seat, 3);
            this.setTing(seat)
        }
        else if (actionInfo.act == "Men") {
            // 闷
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            this._playerInfoMap.get(this.lastOutSeat).outMj.pop();
            this._playerInfoMap.get(seat).menMj.push(mjid);
            this.outMjChange(this.lastOutSeat)
            this.menArrayChange(seat)
            this._playerInfoMap.get(seat).isMen = true;
            this.onAnimationPlay(seat, 5);
            this.setMen(seat)
        }
        else if (actionInfo.act == "ZiMoMen") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            var mjid = actionInfo.msg.tile
            this.removeHandMj(this._playerInfoMap.get(seat).inMj, mjid);
            this.handMjChange(seat);
            this._playerInfoMap.get(seat).menMj.push(mjid);
            this._playerInfoMap.get(seat).isMen = true;
            this.menArrayChange(seat)
            this.onAnimationPlay(seat, 5);
            this.setMen(seat)
        }
        else if (actionInfo.act == "Trustee") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            if (actionInfo.trustee)
                this._playerInfoMap.get(seat).isTrustee = true;
            else
                this._playerInfoMap.get(seat).isTrustee = false;
            this.setTrustee(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if (actionInfo.act == "Offline") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isOnline = false;
            this.setPlayerOnline(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if (actionInfo.act == "Reconnect") {
            var seat = this.getRealSeatByRemoteSeat(actionInfo.chair);
            this._playerInfoMap.get(seat).isOnline = true;
            this.setPlayerOnline(seat)
            this.curStep += 1
            this.doActiton()
            return
        }
        else if (actionInfo.act == "WaitActions") {
            for (var info of actionInfo.data) {
                var seat = this.getRealSeatByRemoteSeat(info.chair_id);
                var actionMap = new Map();
                for (var idx = 0; idx < info.actions.length; idx++)
                    actionMap.set(info.actions[idx].action, info.actions[idx].tile)
                this.onActionWait(seat, actionMap)
            }
        }
        this.curStep += 1
    }

    selectHuanPai(isFinished) {
        if (!isFinished) // 换牌开始前
            this.initHpView()
        else
            this.clearHpView()
        this._playerInfoMap.forEach((infoObj, seat) => {
            var selectList = []
            if (!isFinished) // 换牌开始前
                selectList = infoObj.selectHp
            else // 换牌后
            {
                var inMjList = this._playerInfoMap.get(seat).inMj
                for (var mjId of infoObj.selectHp) {
                    for (var i = 0; i < inMjList.length; ++i) {
                        if (inMjList[i] == mjId) {
                            inMjList.splice(i, 1);
                            break;
                        }
                    }
                }
                selectList = infoObj.receiveHp
                this._playerInfoMap.get(seat).inMj = inMjList.concat(selectList)
                this._playerInfoMap.get(seat).inMj.sort(function (a, b) { return a - b });
                this.handMjChange(seat)
            }
            this.setInMjGrey(seat, selectList)
        })
    }

    initHpView() {
        this._playerInfoMap.forEach((infoObj, seat) => {
            var tempNode = this.node.getChildByName("node_hp_view_" + seat)
            tempNode.active = true;
            tempNode.getChildByName("seat_" + seat).active = true;
            for (var i = 0; i < infoObj.selectHp.length; i++) {
                tempNode.getChildByName("seat_" + seat).getChildByName("mj_" + i).active = true
                this.loadTextureAddCache(tempNode.getChildByName("seat_" + seat).getChildByName("mj_" + i).getChildByName("sp"), "/card_mj/mj_" + infoObj.selectHp[i])
            }
        })
    }

    clearHpView() {
        for (var i = 0; i < 4; i++) {
            this.node.getChildByName("node_hp_view_" + i).active = false;
        }
    }

    // 将某一类麻将变灰（万，筒，条）
    updateMjColorByType(seat) {
        var type = this._playerInfoMap.get(seat).dqType
        var mjarray = this._playerInfoMap.get(seat).inMj;
        if (type < 0)
            return
        var limitUp = 10
        var limitDown = 0
        if (type == 1) {
            limitUp = 20
            limitDown = 10
        }
        else if (type == 2) {
            limitUp = 30
            limitDown = 20
        }
        if (seat == 0)
            var hidenum = this._playerInfoMap.get(seat).pgMj.length * 3
        else
            var hidenum = (4 - Math.floor(mjarray.length / 3)) * 3;
        try {
            for (var i = 0; i < mjarray.length; ++i) {
                // 幺鸡麻将幺鸡不变色
                if (this.gameType == GAME_TYPE.YJMJ && mjarray[i] == this.laiziValue) {
                    this._playerCardMap.get(seat).mjInArray[i + hidenum].getChildByName("gray").active = false
                }
                // 自贡麻将幺鸡不变色
                else if (this.gameType == GAME_TYPE.ZGMJ && mjarray[i] == this.laiziValue) {
                    this._playerCardMap.get(seat).mjInArray[i + hidenum].getChildByName("gray").active = false
                }
                else if (mjarray[i] > limitDown && mjarray[i] < limitUp)
                    this._playerCardMap.get(seat).mjInArray[i + hidenum].getChildByName("gray").active = true
                else if (mjarray[i] < limitDown || mjarray[i] > limitUp)
                    this._playerCardMap.get(seat).mjInArray[i + hidenum].getChildByName("gray").active = false
            }
        }
        catch (e) { }
    }

    setInMjGrey(seat, mjList) {
        var idxList = []
        var tempCardList = JSON.parse(JSON.stringify(this._playerInfoMap.get(seat).inMj))
        for (var i = 0; i < mjList.length; i++) {
            var mjId = mjList[i]
            var idx = tempCardList.indexOf(mjId)
            tempCardList[idx] = -1
            idxList.push(idx)
        }
        for (var i = 0; i < this._playerCardMap.get(seat).mjInArray.length; i++) {
            if (idxList.indexOf(i) >= 0)
                this._playerCardMap.get(seat).mjInArray[i].getChildByName("gray").active = true
            else
                this._playerCardMap.get(seat).mjInArray[i].getChildByName("gray").active = false
        }
    }

    // 播放换牌动画(顺时针0，逆时针1, 对角交换2)
    doHpAction(type) {
        this.node.getChildByName("node_hp").active = true
        // 文字动画
        var acitonNode = this.node.getChildByName("chick_action_node")
        acitonNode.getComponent(cc.Sprite).spriteFrame = this.chickSp[type + 6]
        acitonNode.stopAllActions();
        let action0 = cc.delayTime(2);
        let action1 = cc.fadeIn(0.3);
        let action2 = cc.delayTime(1.5);
        let action3 = cc.fadeOut(0.3);
        let action4 = cc.delayTime(2);
        let action5 = cc.callFunc(() => {
            this.node.getChildByName("node_hp").getChildByName("action_hp").active = false
            this.selectHuanPai(true)
            this.setDingQue() // 换牌动画完成之后设置定缺
            this.setRound()
            this.setCardNum()
        }, this);
        let seq = cc.sequence(action0, action1, action2, action3, action4, action5);
        acitonNode.runAction(seq);
        // 箭头动画
        var actionNodeJT = this.node.getChildByName("node_hp").getChildByName("action_hp")
        actionNodeJT.active = true
        actionNodeJT.angle = 0
        actionNodeJT.getComponent(cc.Sprite).spriteFrame = this.huanpaiSp[type]
        if (type == 0) // 顺时针
        {
            var JtAction0 = cc.delayTime(2)
            var JtAction = cc.rotateTo(1.5, -90)
            let seq = cc.sequence(JtAction0, JtAction)
            actionNodeJT.runAction(seq)

        }
        else if (type == 1) {
            var JtAction0 = cc.delayTime(2)
            var JtAction = cc.rotateTo(1.5, 90)
            let seq = cc.sequence(JtAction0, JtAction)
            actionNodeJT.runAction(seq)
        }
        else {
            var JtAction0 = cc.delayTime(2)
            var JtAction = cc.fadeIn(0.2);
            let JtAction2 = cc.delayTime(0.2);
            var JtAction3 = cc.fadeOut(0.2);
            var JtSeq = cc.sequence(JtAction0, cc.repeat(cc.sequence(JtAction, JtAction2, JtAction3), 2));
            actionNodeJT.runAction(JtSeq)
        }
        this.newHpAction(type)
    }

    public newHpAction(type) {
        this._playerInfoMap.forEach((infoObj, seat) => {
            var delayAction = cc.delayTime(2)
            var jiaoDu = 0
            if (type == 0) // 顺时针动画
            {
                jiaoDu = -90
                if (this.playerNum == 3 && seat == 3)
                    jiaoDu = -180
                else if (this.playerNum == 2)
                    jiaoDu = -180
                var hpAction = cc.rotateTo(1.5, jiaoDu)
                let seq = cc.sequence(delayAction, hpAction)
                this.node.getChildByName("node_hp_view_" + seat).runAction(seq)
            }
            else if (type == 1) // 逆时针动画
            {
                jiaoDu = 90
                if (this.playerNum == 3 && seat == 1)
                    jiaoDu = 180
                else if (this.playerNum == 2)
                    jiaoDu = 180
                var hpAction = cc.rotateTo(1.5, jiaoDu)
                let seq = cc.sequence(delayAction, hpAction)
                this.node.getChildByName("node_hp_view_" + seat).runAction(seq)
            }
            else {
                var hpAction = cc.rotateTo(1.5, 180)
                let seq = cc.sequence(delayAction, hpAction)
                this.node.getChildByName("node_hp_view_" + seat).runAction(seq)
            }
        })
    }

    setStage(seat, huType) // 1 胡 2 自摸
    {
        if (!Utils.isXzmj(this.gameType))
            return
        var playerNode = this.node.getChildByName("player_info").getChildByName("player" + seat)
        playerNode.getChildByName("stage").active = true
        playerNode.getChildByName("stage").getComponent(cc.Sprite).spriteFrame = this.stageSp[(this.curHuNum - 1) + (huType - 1) * 3]
    }

    //设置一张牌的显示，type为0 手牌 1为 出牌
    setMjTexture(seat, node, mjid, type) {
        if (mjid < 0 || mjid > 37) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }

        //为0为背面，需要单独处理
        if (mjid == 0) {
            var str = "/card_mj/";
            if (seat == 1 || seat == 3)
                str += "mj_out_1_3_b";
            else if (seat == 0) {
                if (type == 0)
                    str += "mj_in_0";
                else
                    str += "mj_pg_0_b";
            }
            else {
                if (type == 2)
                    str += "mj_pg_2_b";
                else
                    str += "mj_out_2_b";

            }
            this.loadTextureAddCache(node, str, function () { node.active = true; })
            this.loadTextureAddCache(node.getChildByName("sp"), "")
        }
        else {
            var str = "/card_mj/";
            if (seat == 1 || seat == 3)
                str += "mj_out_1_3";
            else if (seat == 0) {
                if (type == 0)
                    str += "mj_in_0";
                else if (type == 1)
                    str += "mj_out_2";
                else
                    str += "mj_pg_0";
            }
            else {
                if (type == 2)
                    str += "mj_pg_2";
                else
                    str += "mj_out_2";
            }
            this.loadTextureAddCache(node, str, function () { node.active = true; })
            this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid)
        }
    }

    protected getActionType(action) {
        //  碰:1, 直杠:2,  点炮:3,  自摸:4,  补杠:5,   暗杠:6,  慌庄:7,  其他:过(保留)
        var type = 0
        if (action == MJ_ACTION.ACTION_PENG)
            type = 1
        else if (action == MJ_ACTION.ACTION_MING_GANG)
            type = 2
        else if (action == MJ_ACTION.ACTION_AN_GANG)
            type = 6
        else if (action == MJ_ACTION.ACTION_BA_GANG)
            type = 5
        else if (action == MJ_ACTION.ACTION_HU)
            type = 3
        else if (action == MJ_ACTION.ACTION_QIANG_GANG_HU) // 抢杠胡
            type = 12
        else if (action == MJ_ACTION.ACTION_ZI_MO)
            type = 4
        else if (action == MJ_ACTION.ACTION_TING)
            type = 8
        else if (action == MJ_ACTION.ACTION_PASS)
            type = 9
        else if (action == MJ_ACTION.ACTION_MEN)
            type = 10
        else if (action == MJ_ACTION.ACTION_MEN_ZI_MO)
            type = 11
        else if (action == MJ_ACTION.ACTION_FREE_BA_GANG)
            type = 5
        else if (action == MJ_ACTION.ACTION_FREE_AN_GANG)
            type = 6
        else
            console.log("收到异常action------------------------------", action)
        return type
    }


    /**规则按钮 */
    private button_rule() {
        AudioManager.getInstance().playSFX("button_click")
        var info = {
            rule: JSON.stringify(this.gameRule),
            gameType: this.gameType,
        }
        UIManager.getInstance().openUI(ShowRuleUI, 34, () => {
            UIManager.getInstance().getUI(ShowRuleUI).getComponent("ShowRuleUI").initUI(info, 1);
        })
    }

    //关闭按钮
    close_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        UIManager.getInstance().closeUI(PlayBackUI_MJ);
    }

    //暂停播放按钮
    play_pause_button(event) {
        AudioManager.getInstance().playSFX("button_click")
        if (this.isPlay) {
            this.isPlay = false;
            this.node.getChildByName("btn_play").active = true
            this.node.getChildByName("btn_pause").active = false
        }
        else {
            this.isPlay = true;
            this.node.getChildByName("btn_play").active = false
            this.node.getChildByName("btn_pause").active = true

        }
    }

    //暂停播放按钮
    playback_speed_button(event, customEventData) {
        AudioManager.getInstance().playSFX("button_click")
        if (customEventData == "right") {
            if (this.speed == 0.25)
                return
            this.speed /= 2
            var strSpeed = "1x"
            if (this.speed == 0.5)
                strSpeed = "2x"
            else if (this.speed == 0.25)
                strSpeed = "4x"
        }
        else {
            if (this.speed == 1)
                return
            this.speed *= 2
            var strSpeed = "1x"
            if (this.speed == 0.5)
                strSpeed = "2x"
            else if (this.speed == 0.25)
                strSpeed = "4x"
        }
        this.node.getChildByName("label_speed").getComponent(cc.Label).string = strSpeed
    }


    btn_round() {
        AudioManager.getInstance().playSFX("button_click")
        if (this.gameType == GAME_TYPE.LFMJ || this.gameType == GAME_TYPE.MHXL) {
            UIManager.getInstance().openUI(ZjScoreDetailPage_UI, 32, () => {
                UIManager.getInstance().getUI(ZjScoreDetailPage_UI).getComponent("ZjScoreDetailPage_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.benji);
            })
        }
        else if (this.gameType == GAME_TYPE.ZGMJ) {
            UIManager.getInstance().openUI(ZgRoundOver_UI, 32, () => {
                UIManager.getInstance().getUI(ZgRoundOver_UI).getComponent("ZgRoundOver_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime, this.luoBoPais);

            })
        }
        else if (Utils.isXzmj(this.gameType)) {
            UIManager.getInstance().openUI(XzRoundOver_UI, 32, () => {
                UIManager.getInstance().getUI(XzRoundOver_UI).getComponent("XzRoundOver_UI").playBackInitView(this.balanceInfo, this._playerInfoMap, this.gameRule, this.gameType, this.startTime);

            })
        }
    }

    public loadTextureAddCache(loadnode, url: string, callback: any = null) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }

        if (loadnode == null || sprite == null)
            return;
        if (this.cardCache.get(url)) {
            sprite.spriteFrame = this.cardCache.get(url)
            if (callback != null)
                callback();
            return;
        }
        cc.resources.load(url, cc.SpriteFrame,
            function (err, spriteFrame) {
                if (err) {
                    return;
                }
                sprite.spriteFrame = spriteFrame;
                this.cardCache.set(url, spriteFrame)
                if (callback != null)
                    callback();
            }.bind(this));
    }




}
