import { LogWrap } from "../Utils/LogWrap";
import CryptoJS = require("crypto-js")
import UCrypto from "../Utils/UCrypto"
import URandomHelper from "./URandomHelper";

export class HttpManager {
    private static instance: HttpManager;
    public static getInstance(): HttpManager {
        if (this.instance == null)
            this.instance = new HttpManager();

        return this.instance;
    }

    get(url, path, params, callback,timeout = 30000) {
        let xhr = new XMLHttpRequest();
        xhr.timeout = timeout;
        let requestURL = url + path;
        if (params)
            requestURL = requestURL + "?" + params;
        LogWrap.log("http_get:",requestURL);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                try {
                    var ret = xhr.responseText;
                    if (callback !== null)
                        callback(null, ret);
                    return;
                } catch (e) {
                    callback(e, null);
                }
            }
            else if (xhr.readyState === 4) // 没有正常响应
            {
                xhr.onerror = null // 没有正常响应的情况下就不再次触发onerror避免重复调用
                callback(null,null)
            }
            else {
            }
        };
        
        xhr.ontimeout = function (e) {
            xhr.onerror = null
            callback(e, null);
        };

        xhr.onerror = function (e) {
            callback(e, null);
        };

        xhr.open("GET", encodeURI(requestURL), true);
        if (cc.sys.os == cc.sys.OS_ANDROID)
            xhr.withCredentials = true;
        // if (cc.sys.isNative) {
        //     xhr.setRequestHeader("Accept", "text/html");
        //     xhr.setRequestHeader("Accept-Charset", "utf-8");
        //     xhr.setRequestHeader("Accept-Encoding", "gzip,deflate");
        // }
        xhr.send();
        return xhr;
    }

    post(url, path, params, body, callback) {
        let xhr = new XMLHttpRequest();
        xhr.timeout = 30000;
        let requestURL = url + path;
        if (params)
            requestURL = requestURL + "?" + params;
        LogWrap.log("http_post:",requestURL);
        xhr.open("POST", requestURL, true);
        // if (cc.sys.isNative) {
        //     xhr.setRequestHeader("Accept", "text/html");
        //     xhr.setRequestHeader("Accept-Charset", "utf-8");
        //     xhr.setRequestHeader("Accept-Encoding", "gzip,deflate");
        // }
        if (cc.sys.os == cc.sys.OS_ANDROID)
            xhr.withCredentials = true;
        if (body) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("cache-control", "no-cache");
        }


        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                try {
                    let ret = xhr.responseText;
                    if (callback !== null) {
                        callback(null, ret);
                    }
                    return;
                } catch (e) {
                    callback(e, null);
                }
            }
            else
            {
                LogWrap.warn(xhr.readyState + ":" + xhr.status);
                //callback(xhr.readyState + ":" + xhr.status, null);
            }
        };
        if (body)
            xhr.send(body);
        return xhr;
    }

    download(url, path, params, callback) {
        let xhr = new XMLHttpRequest();
        xhr.timeout = 5000;
        let requestURL = url + path;
        if (params)
            requestURL = requestURL + "?" + params;

        xhr.responseType = "arraybuffer";
        LogWrap.log("http_download:",requestURL);
        xhr.open("GET", requestURL, true);
        if (cc.sys.isNative) {
            xhr.setRequestHeader("Accept", "text/html");
            xhr.setRequestHeader("Accept-Charset", "utf-8");
            xhr.setRequestHeader("Accept-Encoding", "gzip,deflate");
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                let buffer = xhr.response;
                let dataview = new DataView(buffer);
                let ints = new Uint8Array(buffer.byteLength);
                for (let i = 0; i < ints.length; i++)
                    ints[i] = dataview.getUint8(i);
                callback(null, ints);
            }
            else
            {
                LogWrap.warn(xhr.readyState + ":" + xhr.status);
                //callback(xhr.readyState + ":" + xhr.status, null);
            }
        };
        xhr.send();
        return xhr;
    }
    /**
 * 加密url，并返回
 * @param url url
 */
     encryptUrl(url, param = "token",en?:string) {
        let index = url.indexOf('?')
        if (index == -1) return url
        let str = url.substr(index + 1)
        let key = "60thuWgcYdFxjFGZ/uZ1Ni2zARf3kLpN"
        if(en)
        {
            key = en
        }
        let encryptParam = UCrypto.CustomEncrypt(str, key, CryptoJS.mode.ECB, CryptoJS.pad.Pkcs7)
        let encodeEncryptParam = encodeURIComponent(encryptParam)
        let result = `${url.substr(0, index + 1)}${param}=${encodeEncryptParam}`;
        return result
    }

    decrypt(value,en?:string) {
        let key = "60thuWgcYdFxjFGZ/uZ1Ni2zARf3kLpN"
        if(en)
        {
            key = en
        }
        let encrypt = decodeURIComponent(value)
        let result = UCrypto.custDecrypt(encrypt, key, CryptoJS.mode.ECB, CryptoJS.pad.Pkcs7)
        return result

    }

    getEnStr(bin?:boolean)
    {

        /**
        "{
            "hotfix_url": "https://dymjupdate.oss-cn-shenzhen.aliyuncs.com",
            "backstage_url": "https://api.gwjgu.com",
            "replace_url": "http://8.210.16.57:9000",
            "version": "1.0.41",
            "kefu": "",
            "configList": [
            "https://dymjdeploy.oss-cn-hongkong.aliyuncs.com",
            "https://dymjdeploy.clqvq.com",
            "https://shunxin.blob.core.windows.net"
            ],
            "address_list": [
            "sxws.hcodg.com:8100",
            "103.39.231.249:8100",
            "103.39.231.102:8200"
            ],
            "online_kefu_url": "https://d757018930e74.chatnow.mstatik.com/widget/standalone.html?eid=f9119b381990c6d621d1267c2e661e7a",
            "regionlist": [
            "福建"
            ],
            "log": 0
            }"
         */

        // "wSasCrjC@1@v#9ibFORmrT38ig4iXkkk"
        let n = 1657163431182
        if(bin)
        {
            //"sGBwoLj-@tt@3#3fZB-Of7rTg%dA#UaU"
            n = 1657191022478
        }
        URandomHelper.seededRandom(n)
        let config = [
            "C21GsaBSwQd",
            "@CL-Njkoarc",
            "LVHvt1@3b@O",
            "9b3fU*CCi#E",
            "BmyFjOR-ZOB",
            "87Ur3TxRfwR",
            "AUaodgis4%J",
            "PU#cXYFkSa4",
            "gp5YHkW*BsP",
            "I8aQJbhYH73"
        ]
        let enstr = ''
        for(let i = 0;i<8;i++)
        {
            let s = (URandomHelper.randomInt(1000,10000)).toString()
            for(let j = 0;j<s.length;j++)
            {
                enstr = enstr+config[i][s[j]]
            }
        }
        LogWrap.log(enstr)
        return enstr
    }

    httpRequest(method: string, url: string, setXhr: (xhr: XMLHttpRequest) => void, data: any, onSuccess: (xhr: XMLHttpRequest) => void, onFail: (status_text: string) => void) 
    {
        LogWrap.log("httpRequest:method"+method,"url:"+url)
     
        let xhr = cc.loader.getXMLHttpRequest()
        xhr.open(method, url, true)
        if (setXhr) setXhr(xhr)
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (onSuccess) onSuccess(xhr)
                }
                else {
                    if (onFail) onFail(""+xhr.status)
                }
            }
        }
        xhr.onabort = function () {
            if (onFail) onFail("abort")
        }
        xhr.ontimeout = function () {
            if (onFail) onFail("timeout")
        }
        xhr.onerror = function () {
            if (onFail) onFail("error")
        }
        if (method.toUpperCase() == "POST") {
            xhr.send(data)
        }
        else {
            xhr.send()
        }
        LogWrap.log(`${method} ${url}`)
    }

    getHttp(url: string, setXhr: (xhr: XMLHttpRequest) => void, onSuccess: (xhr: XMLHttpRequest) => void, onFail: (status_text: string) => void) 
    {
        this.httpRequest("GET", url, setXhr, null, onSuccess, onFail)
    }
}