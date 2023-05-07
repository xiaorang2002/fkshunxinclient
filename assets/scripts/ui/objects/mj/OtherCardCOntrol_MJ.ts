import { ListenerType } from './../../../data/ListenerType';
import { ConstValue, GAME_TYPE } from './../../../data/GameConstValue';
import { ListenerManager } from './../../../../framework/Manager/ListenerManager';
import { GAME_STATE_MJ } from './../../../data/mj/defines';
import { Utils } from "../../../../framework/Utils/Utils";
import { GameDataManager } from "../../../../framework/Manager/GameDataManager";
import { MessageManager } from "../../../../framework/Manager/MessageManager";
import { LogWrap } from "../../../../framework/Utils/LogWrap";

const { ccclass, property } = cc._decorator;
@ccclass
export default class OtherCardCOntrol_MJ extends cc.Component {


    @property(cc.Integer)
    seat: number = 0;
    @property(cc.Integer)
    outCardNum: number = 0;
    private mjData = null;
    /**手牌数组 node */
    private mjInArray = [];
    /**出牌数组 node */
    private mjOutArray = [];
    /**碰杠数组 */
    private mjPgArray = [];
    /**闷牌数组 */
    private mjMenArray = [];
    /**位置数组 */
    private mjPosArray = [];
    /**明牌数组 */
    private mjMpArray = [];
    /**是否可以操作牌的表识 */
    private markNode = null;
    private addSize = 0
    private cardCache = new Map()
    
    onDataRecv()
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
    }

    onDestroy(){
        ListenerManager.getInstance().removeAll(this);
        this.mjData = null;
    }


    onShow(){
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        this.markNode = null
    }

    resetDataOnBack()
    {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
    }

    // 加载放在onload中防止父节点destroy的时候，当子节点没有被激活时，无法销毁的问题
    onLoad()
    {
        var parentSize = this.node.getParent().getParent().getContentSize()
        this.node.setContentSize(parentSize.width, parentSize.height);
        this.addSize = parentSize.width - ConstValue.SCREEN_W
        this.initMenCard()
        this.initArray()
        this.luoboActive()
    }

    luoboActive()
    {
        this.node.getChildByName("luobo").active = false
    }

    luoboActiveValue(v:number)
    {
       let luobo = this.node.getChildByName("luobo")
       luobo.active = true
       luobo.getChildByName("label").getComponent(cc.Label).string = "bx"+v
       luobo.runAction(cc.blink(0.2,1))
    }

    setAll(seat) {
        this.markNode = null

        this.handMjChange(seat);
        this.pgMjChange(seat);
        this.outMjChange(seat);
        this.menArrayChange(seat);
        this.onHuPaiByXueZhan()
    }

    /**初始化node数组 */
    initArray() {
        this.mjInArray = [];
        this.mjOutArray = [];
        this.mjPgArray = [];
        this.mjPosArray = [];
        this.mjMpArray = []

        // 根据选择麻将风格初始化麻将
        this.initCardStyle()

        // 动态克隆手牌
        var inFirstMjNode = this.node.getChildByName("mj_in").getChildByName("mj_0");
        var inMjParent = inFirstMjNode.parent
        var inFirstMjPos = inFirstMjNode.position
        for (var num = 0; num < 14; ++num) {
            //手牌初始化
            var inMjNode = cc.instantiate(inFirstMjNode)

            if (num == 13){
                if (this.seat == 2)
                    inMjNode.setPosition(inFirstMjPos.x - num * 36 - 20, inFirstMjPos.y);
                else if (this.seat == 1)
                    inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y + num * 25.5 + 33);
                else
                    inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y - num * 24 - 37);
            }
            else{
                if (this.seat == 2)
                    inMjNode.setPosition(inFirstMjPos.x - num * 36, inFirstMjPos.y);
                else if (this.seat == 1)
                {
                    inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y + num * 25.5);
                    inMjNode.zIndex = 13 - num
                }
                else
                    inMjNode.setPosition(inFirstMjPos.x, inFirstMjPos.y - num * 24);
            }
            inMjNode.parent = inMjParent
            this.mjInArray.push(inMjNode);
            this.mjPosArray.push(inMjNode.position);
        }

        // 动态克隆手牌（明牌）
        var inFirstMpNode = this.node.getChildByName("mj_mp").getChildByName("mj_0");
        var inMpParent = inFirstMpNode.parent
        for (var num = 0; num < 14; ++num) {
            var mpMjNode = cc.instantiate(inFirstMpNode)
            if (num == 13){
                if (this.seat == 2)
                    mpMjNode.setPosition(inFirstMpNode.x - num * 37 - 20, inFirstMpNode.y);
                else if (this.seat == 1)
                    mpMjNode.setPosition(inFirstMpNode.x, inFirstMpNode.y + num * 32 + 21);
                else
                    mpMjNode.setPosition(inFirstMpNode.x, inFirstMpNode.y - num * 32 - 22);
            }
            else{
                if (this.seat == 2)
                    mpMjNode.setPosition(inFirstMpNode.x - num * 37, inFirstMpNode.y);
                else if (this.seat == 1)
                {
                    mpMjNode.setPosition(inFirstMpNode.x, inFirstMpNode.y + num * 32);
                    mpMjNode.zIndex = 13 - num
                }
                else
                    mpMjNode.setPosition(inFirstMpNode.x, inFirstMpNode.y - num * 32);
            }
            mpMjNode.parent = inMpParent
            this.mjMpArray.push(mpMjNode);
        }
        
        // 动态克隆出的牌
        var outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
        var outMjParent = outFirstMjNode.parent
        var outFirstMjPos = outFirstMjNode.position
        for (var num = 0; num < this.outCardNum; ++num) {
            //出牌初始化
            var outMjNode = cc.instantiate(outFirstMjNode)
            if (this.seat == 2){
                outMjNode.zIndex = num
                if (num < 11){
                    outMjNode.setPosition(outFirstMjPos.x - num * 51, outFirstMjPos.y);
                }
                else if (num < 22)
                {
                    outMjNode.setPosition(outFirstMjPos.x - (num-11) * 51, outFirstMjPos.y -57);
                }
                else if (num < 33){
                    outMjNode.setPosition(outFirstMjPos.x - (num-22) * 51, outFirstMjPos.y + 16);
                }
                else if (num < 44)
                {
                    outMjNode.setPosition(outFirstMjPos.x - (num-33) * 51, outFirstMjPos.y - 41);
                }

            }
            else if (this.seat == 1){
                if (num < 11){
                    outMjNode.zIndex = 33 - num
                    outMjNode.setPosition(outFirstMjPos.x, outFirstMjPos.y + 39 *num);
                }
                else if (num < 22){
                    outMjNode.zIndex = 22 - num
                    outMjNode.setPosition(outFirstMjPos.x - 56, outFirstMjPos.y + 39 * (num-11));
                }
                else{
                    outMjNode.zIndex = 11 - num
                    outMjNode.setPosition(outFirstMjPos.x, (outFirstMjPos.y+9) + 39 * (num-22));
                }
                
            }
            else{
                if (num < 11)
                    outMjNode.setPosition(outFirstMjPos.x, outFirstMjPos.y - 39 * num);
                else if (num < 22)
                    outMjNode.setPosition(outFirstMjPos.x +57, outFirstMjPos.y - 39* (num-11));
                else
                    outMjNode.setPosition(outFirstMjPos.x, outFirstMjPos.y + 9 - 39 * (num-22));
            }
            outMjNode.parent = outMjParent
            this.mjOutArray.push(outMjNode);
            this.node.getChildByName("mj_mp").active = false
        }
        for (var k = 0; k < 4; ++k) {
            //碰杠牌初始化
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            this.mjPgArray.push(mjnode);
        }
    }

    // 初始化闷牌位置
    initMenCard()
    {
        var menFirstMjNode = this.node.getChildByName("mj_men").getChildByName("mj_0");
        var menMjParent = menFirstMjNode.parent
        var menFirstMjPos = menFirstMjNode.position
        for (var num = 0; num < 12; ++num) {
            var menMjNode = cc.instantiate(menFirstMjNode)
            if (this.seat == 1)
            {
                menMjNode.zIndex = 13 - num
                if (num < 6)
                    menMjNode.setPosition(menFirstMjPos.x, menFirstMjPos.y + num*18);
                else
                    menMjNode.setPosition(menFirstMjPos.x + 29, menFirstMjPos.y + (num-6)*18);
            }
            else if (this.seat == 2)
            {
                if (num < 6)
                {
                    menMjNode.zIndex = 13 + num
                    menMjNode.setPosition(menFirstMjPos.x - num * 26, menFirstMjPos.y);
                }
                else
                    menMjNode.setPosition(menFirstMjPos.x - (num-6) * 26, menFirstMjPos.y + 29);
            }
            else{
                if (num < 6)
                    menMjNode.setPosition(menFirstMjPos.x, menFirstMjPos.y - num*18);
                else
                    menMjNode.setPosition(menFirstMjPos.x - 29, menFirstMjPos.y - (num-6)*18);
            }
            menMjNode.parent = menMjParent
            this.mjMenArray.push(menMjNode);
        }
    }

    initCardStyle()
    {
        var inFirstMjNode = this.node.getChildByName("mj_in").getChildByName("mj_0");
        var inFirstMpNode = this.node.getChildByName("mj_mp").getChildByName("mj_0");
        var outFirstMjNode = this.node.getChildByName("mj_out").getChildByName("mj_0");
        inFirstMjNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_in_" + this.seat, true)
        var pgStyle = "mj_pg_2"
        if (this.seat == 1 || this.seat == 3)
        {
            outFirstMjNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_out_1_3", true)
            inFirstMpNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_out_1_3", true)
            pgStyle = "mj_out_1_3"
        }
        else
        {
            outFirstMjNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_out_2", true)
            inFirstMpNode.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_out_2", true)
        }
        for (var k = 0; k < 4; ++k) {
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            for (var child of mjnode.children) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(pgStyle, true)
            }
        }
    }

    onCardBgChange()
    {
        var mpStyle = "mj_out_1_3"
        var outStyle = "mj_out_1_3"
        var pgStyle = "mj_out_1_3"
        if (this.seat == 2)
        {
            mpStyle = "mj_out_2"
            outStyle = "mj_out_2"
            pgStyle = "mj_pg_2"
        }
        for (var handMj of this.mjInArray)
            handMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent("mj_in_" + this.seat, true)
        for (var mpdMj of this.mjMpArray)
            mpdMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(mpStyle, true)    
        for (var outMj of this.mjOutArray)
            outMj.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(outStyle, true)  
        for (var k = 0; k < 4; ++k) {
            var mjnode = this.node.getChildByName("mj_pg").getChildByName("pg" + k);
            for (var child of mjnode.children) {
                child.getComponent(cc.Sprite).spriteFrame = this.getSpriteFrameFromParent(pgStyle, true)
            }
        }  
        this.pgMjChange(this.seat)
        this.onHuPaiByXueZhan()
    }

    //设置一张牌的显示，type为0 手牌 1为 出牌
    setMjTexture(node, mjid, type) {
        if (mjid == 255)
        {
            mjid = 0
        }
        if (mjid < 0 || mjid > 37) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }

        //为0为背面，需要单独处理
        if (mjid == 0 || mjid == 255) {
            var str = "";
            if (this.seat == 1 || this.seat == 3)
                str += "mj_out_1_3_b";
            else {
                if (type === 0)
                    str += "mj_pg_2_b";
                else
                    str += "mj_out_2_b";
            }
            this.setMjTextureNewLogic(node, str, null, true)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "")
            node.active = true;

            // this.loadTextureAddCache(node, "/card_mj/"+str,function () {node.active = true;})
            // this.loadTextureAddCache(node.getChildByName("sp"), "")
          
        }
        else {
            node.attr = mjid;
            var str = "";
            if (this.seat == 1 || this.seat == 3)
                str += "mj_out_1_3";
            else {
                if (type === 0)
                    str += "mj_pg_2";
                else
                    str += "mj_out_2";
            }
            this.setMjTextureNewLogic(node, str, null, true)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
            node.active = true;

            // this.loadTextureAddCache(node, "/card_mj/"+str,function () {node.active = true;})
            // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid)
        }
    }

    //刷新手牌麻将的显示(整体刷新)
    handMjChange(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;
        var mjarray = this.mjData.playerInfoMap.get(seat).cards;
        if (mjarray.length == 0) {
            for (var i = 0; i < this.mjInArray.length; ++i) {
                this.mjInArray[i].attr = 0;
                this.setMjTexture(this.mjInArray[i], -1, 0);
            }
        }
        //出牌状态,数组合法性检测
        if (mjarray.length % 3 === 0) {
            return;
        }
        //需要隐藏和显示的牌
        var hidenum = (4 - Math.floor(mjarray.length / 3)) * 3;
        for (var i = 0; i < this.mjInArray.length; ++i) {
            if (i < hidenum || (mjarray.length % 3 === 1 && i === 13))
                this.mjInArray[i].active = false;
            else
                this.mjInArray[i].active = true;
        }
    }
    //刷新出牌显示(整体刷新)
    outMjChange(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat)
            return;

        var outarray = this.mjData.playerInfoMap.get(seat).outCard;
        //需要隐藏和显示的牌
        for (var i = 0; i < this.mjOutArray.length; ++i) {
            if (i < outarray.length)
                this.setMjTexture(this.mjOutArray[i], outarray[i], 1);
            else
                this.mjOutArray[i].active = false;
        }

        //判断是否需要显示出牌提示标志
        if ( this.mjData.playerInfoMap.get(seat).id == this.mjData.gameinfo.lastOutPid && this.mjData.gameinfo.lastOutMjId != -1) {
            if(this.markNode)
                this.removeMark()
            var mark = new cc.Node("mark");
            mark.position = cc.v3(0, 20);
            var msp = mark.addComponent(cc.Sprite);
            Utils.loadTextureFromLocal(msp, "/card_mj/mj_mark", function () { mark.active = true; });
            mark.parent = this.mjOutArray[outarray.length - 1];
            var seq = cc.sequence(cc.moveBy(0.5, cc.v2(0, 20)), cc.moveBy(0.5, cc.v2(0, -20)));
            mark.runAction(cc.repeatForever(seq));
            this.markNode = mark
        }
    }
    //刷新碰杠显示(整体刷新)
    pgMjChange(seat) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (seat != this.seat) {
            return;
        }
        var pgarray = this.mjData.playerInfoMap.get(seat).mjpg;
        //数组解析
        //碰牌  111-10   前3位为碰牌的牌型，第4位为杠牌牌型，-1表示空，即碰牌
        //第5位位位置信息
        for (var i = 0; i < 4; ++i) {
            if (i < pgarray.length) {
                this.mjPgArray[i].active = true;
                for (var j = 0; j < pgarray[i].length; ++j) {
                    //前3位先显示
                    if (j < 4) {
                        var mjnode = this.mjPgArray[i].getChildByName("mj_" + j);
                        var cardId = pgarray[i][j]
                        if ((pgarray[i][5] == 15 || pgarray[i][5] == 6) && j == 3)
                            cardId = 0
                        mjnode.getChildByName("laizi").active = false
                        if (cardId == this.mjData.laiziValue && this.mjData.laiziValue != 0)
                            mjnode.getChildByName("laizi").active = true
                        this.setMjTexture(mjnode, cardId, 0);
                    }
                }
            }
            else
                this.mjPgArray[i].active = false;
        }
    }

    menArrayChange(seat)
    {
        if (seat != this.seat)
            return;
        var menarray = this.mjData.playerInfoMap.get(seat).menCard;
       //需要隐藏和显示的牌
       for (var i = 0; i < this.mjMenArray.length; ++i) {
            if (i < menarray.length)
            {
                var mjid = menarray[i]
                this.setMjTexture(this.mjMenArray[i], mjid, 1);
            }
            else
                this.mjMenArray[i].active = false;
        }
    }

    outMj(msg) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = this.mjData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }

        this.mjData.setHeadCard(msg.id,  this.mjData.playerInfoMap.get(seat).cards)
        this.mjData.setOutCards(msg.id,  this.mjData.playerInfoMap.get(seat).outCard)

    }

    getMj(msg) {
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        var seat = this.mjData.getSeatById(msg.id);
        if (seat != this.seat) {
            return;
        }
        MessageManager.getInstance().messagePost(ListenerType.mj_handMjChanged, { id: msg.id });
    }

    /**移除mark */
    removeMark() {
        if (this.markNode){
            var markParent = this.markNode.parent;
            if (markParent != null)
                markParent.removeChild(this.markNode)
            this.markNode = null
        }
    }

    displaySelectCardInDesk(displayCard)
    {
        for (var i = 0; i < this.mjOutArray.length; ++i) {
            if (this.mjOutArray[i].active)
            {
                if (this.mjOutArray[i].attr == displayCard)
                    this.mjOutArray[i].color = new cc.Color(180,180,180)
                else
                    this.mjOutArray[i].color = new cc.Color(255,255,255)
            }
        }
    }

    resetCardColor()
    {
        for (var i = 0; i < this.mjOutArray.length; ++i)
        {
            if (this.mjOutArray[i].active)
                this.mjOutArray[i].color = new cc.Color(255,255,255)
        }
            
    }


//-------------------------------------------------------------血战接口部分-----------------------------------------------

    onHuPaiByXueZhan()
    {
        if(!Utils.isXzmj(GameDataManager.getInstance().curGameType))
            return
        this.mjData = GameDataManager.getInstance().getDataByCurGameType();
        if (this.mjData)
        {
            var info = this.mjData.huInfoMap.get(this.seat)
            if (!info)
            {
                this.node.getChildByName("mj_in").active = true
                this.node.getChildByName("mj_mp").active = false
                return
            }
            this.node.getChildByName("mj_in").active = false
            this.node.getChildByName("mj_mp").active = true
            var mjarray = this.mjData.playerInfoMap.get(this.seat).cards;
            for (var i = 0; i < this.mjMpArray.length; ++i) {
                if (i == this.mjMpArray.length-1)
                    this.setMpTexture(this.mjMpArray[i], info.huTile) 
                else
                    this.setMpTexture(this.mjMpArray[i], 0);
            }
            //需要隐藏和显示的牌
            var hidenum = (4 - Math.floor(mjarray.length / 3)) * 3;
            for (var i = 0; i < this.mjMpArray.length; ++i) {
                if (i < hidenum)
                    this.mjMpArray[i].active = false;
                else
                    this.mjMpArray[i].active = true;
            }
        }    
        else
        {
            this.node.getChildByName("mj_in").active = true
            this.node.getChildByName("mj_mp").active = false
        }
    }
//-------------------------------------------------------------血战接口部分-----------------------------------------------

    setMpTexture(node, mjid)
    {
        if (mjid < 0 || mjid > 37) {
            //id非法并隐藏该节点
            node.active = false;
            return;
        }
        if (mjid == 0) {
            var str = "";
            if (this.seat == 1 || this.seat == 3)
                str += "mj_out_1_3_b";
            else 
                 str += "mj_out_2_b";

            this.setMjTextureNewLogic(node, str, null, true)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "")
            node.active = true;
            
            // this.loadTextureAddCache(node, "/card_mj/"+str)
            // this.loadTextureAddCache(node.getChildByName("sp"), "")
        }
        else
        {
            var str = "";
            if (this.seat == 1 || this.seat == 3)
                str += "mj_out_1_3";
            else
                str += "mj_out_2";

            this.setMjTextureNewLogic(node, str, null, true)
            this.setMjTextureNewLogic(node.getChildByName("sp"), "mj_" + mjid)
            node.active = true;

            // this.loadTextureAddCache(node, "/card_mj/"+str)
            // this.loadTextureAddCache(node.getChildByName("sp"), "/card_mj/mj_" + mjid)
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
        if (this.cardCache.get(url))
        {
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

    public setMjTextureNewLogic(loadnode, url, callback = null, needStyle = false) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            if (callback != null)
                callback();
            return;
        }
        var spriteFrame = this.getSpriteFrameFromParent(url, needStyle)
        sprite.spriteFrame = spriteFrame;
        if (callback != null)
            callback();
    }


    // 从父节点保存的缓存纹理列表获取指定纹理
    public getSpriteFrameFromParent(url,needStyle){
        var style = cc.sys.localStorage.getItem("mjStyle")
        if (style && needStyle && style == "black")
            url += "_black"
        var gameUIMj = this.node.getParent().getParent().getComponent("GameUI_MJ")
        return gameUIMj.getMjSpriteFrame(url)
    }


}
