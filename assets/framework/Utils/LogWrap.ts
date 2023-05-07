let OPENLOGFLAG = true;

export class LogWrap {

    //心跳日志打印开关
    public static readonly HEART_LOG_SWITCH = false;
    private static logArg = []

    private static getDateString(): string {
        let d = new Date();
        let str = d.getHours().toString();
        let timeStr = "";
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = d.getMinutes().toString();
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = d.getSeconds().toString();
        timeStr += (str.length == 1 ? "0" + str : str) + ":";
        str = d.getMilliseconds().toString();
        if (str.length == 1) str = "00" + str;
        if (str.length == 2) str = "0" + str;
        timeStr += str;

        timeStr = "[" + timeStr + "]";
        return timeStr;
    }

    private static stack(index): string {
        let e = new Error();
        let lines = e.stack.split("\n");
        lines.shift();
        let result = [];
        lines.forEach(function (line) {
            line = line.substring(7);
            let lineBreak = line.split(" ");
            if (lineBreak.length < 2) {
                result.push(lineBreak[0]);
            } else {
                result.push({ [lineBreak[0]]: lineBreak[1] });
            }
        });

        let list = [];
        if (index < result.length) {
            for (let a in result[index]) {
                list.push(a);
            }
        }
        if (list.length == 0)
            return;
        let splitList = list[0].split(".");
        return (splitList[0] + ".ts->" + splitList[1] + ": ");
    }

    public static log(...args) {
        let backLog = console.log || cc.log// || log;
        if (OPENLOGFLAG)
        {
            backLog.call(this, "%s%s:", LogWrap.stack(2), LogWrap.getDateString(), ...args);
        }else{
            this.pushLog({"log":args})
        }
           
    }

    public static info(...args) {
        let backLog = console.log || cc.log// || log;
        if (OPENLOGFLAG)
        {
            backLog.call(this, "%c%s%s: " + cc.js.formatStr.apply(cc, arguments), "color:#00CD00;", LogWrap.stack(2), LogWrap.getDateString());
        }else{
            this.pushLog({"info":args})
        }
           
    }

    public static warn(...args) {
        let backLog = console.log || cc.log// || log;
        if (OPENLOGFLAG)
        {
            backLog.call(this, "%c%s%s: " + cc.js.formatStr.apply(cc, arguments), "color:#EE7700;", LogWrap.stack(2), LogWrap.getDateString());
        }else{
            this.pushLog({"warn":args})
        }
           
    }

    public static err(...args) {
        let backLog = console.log || cc.log// || log;
        if (OPENLOGFLAG)
        {
            backLog.call(this, "%c%s%s: " + cc.js.formatStr.apply(cc, arguments), "color:#CD0000;", LogWrap.stack(2), LogWrap.getDateString());
        }else{
            this.pushLog({"err":args})
        }
            
    }

    private static pushLog(obj)
    {
        this.logArg.push(obj)
        if(this.logArg.length > 50){
            this.logArg.shift()
        }
    }

    public static set enble(v)
    {
        OPENLOGFLAG = v
        if(v)
        { 
            let arr = this.logArg
            arr.forEach((obj)=>{
                Object.keys(obj).forEach((v,k) => {
                    if(obj[v])
                    {
                        this.log(obj[v].toString())
                    }
                },this);
            },this)
            this.logArg = []
        }
     
    }
}