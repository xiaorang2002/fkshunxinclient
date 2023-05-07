
import CryptoJS = require('crypto-js');
// var JSEncrypt = require('jsencrypt').default;
import { Buffer } from 'buffer';

const key = CryptoJS.enc.Latin1.parse("1234123412ABCDEF");  //十六位十六进制数作为密钥
// const key = CryptoJS.enc.Utf8.parse("1234");  //十六位十六进制数作为密钥
// const iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');   //十六位十六进制数作为密钥偏移量
const iv = CryptoJS.enc.Latin1.parse('1234123412ABCDEF');   //十六位十六进制数作为密钥偏移量

export default class UCrypto {

    static thisKeyPair: any = {};
    static bits = 1024;
    static aeskey = "";
    static isAes = false;



    static Decrypt(word) {
        let encryptedHexStr = CryptoJS.enc.Hex.parse(word);
        let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        let decrypt = CryptoJS.AES.decrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();

        // let u8array = new Uint8Array(word);

        // // 将u8array转换成WordArray
        // word = UCrypto.parse(u8array);

        // // 要求密文是base64格式
        // word = word.toString(CryptoJS.enc.Base64);
        // // 解密key

        // var decrypted = CryptoJS.AES.decrypt(word, key, {
        //     iv: key,
        //     mode: CryptoJS.mode.CBC,
        //     padding: CryptoJS.pad.Pkcs7
        // });
        // var message = decrypted.toString(CryptoJS.enc.Utf8);
        // return JSON.parse(message);
    }
    /** 自定义解密 64进制 */
    static custDecrypt(word,keystr,cryptoMode,Cryptcpadding) {
        let key = CryptoJS.enc.Latin1.parse(keystr)
        let encryptedHexStr = CryptoJS.enc.Base64.parse(word);
        let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        let decrypt = CryptoJS.AES.decrypt(srcs, key, { iv:key, mode: cryptoMode, padding: Cryptcpadding });
        let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
        return decryptedStr.toString();
    }

    //加密方法
    static CustomEncrypt(word, keystr,cryptoMode,Cryptcpadding) {
        var key = CryptoJS.enc.Latin1.parse(keystr);
        let encrypted = CryptoJS.AES.encrypt(word, key, { iv: key, mode: cryptoMode, padding: Cryptcpadding });
        let encryptedHexStr = CryptoJS.enc.Hex.parse(encrypted.ciphertext.toString());
        let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
        return srcs
    }

    //加密方法
    static Encrypt(word) {
        var key = CryptoJS.enc.Latin1.parse("0000000000000000");
        // var encrypted = CryptoJS.AES.encrypt(word, key, {
        //     iv: key,
        //     mode: CryptoJS.mode.CBC,
        //     padding: CryptoJS.pad.Pkcs7
        // });
        // return UCrypto.stringify(encrypted.ciphertext);



        // let srcs = CryptoJS.enc.Utf8.parse(word);
        let encrypted = CryptoJS.AES.encrypt(word, key, { iv: key, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return encrypted.ciphertext.toString().toUpperCase();
    }



    static stringify(wordArray) {
        var words = wordArray.words;
        var sigBytes = wordArray.sigBytes;
        var u8 = new Uint8Array(sigBytes);
        for (var i = 0; i < sigBytes; i++) {
            var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            u8[i] = byte;
        }
        return u8;
    }

    static parse(u8arr) {
        var len = u8arr.length;
        var words = [];
        for (var i = 0; i < len; i++) {
            words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8);
        }
        return CryptoJS.lib.WordArray.create(words);
        // return CryptoJS.lib.WordArray.create(words);
    }


    static encryptU8arry(array) {
        var acontent = array;
        var key = CryptoJS.enc.Latin1.parse(UCrypto.aeskey);
        var iv = CryptoJS.enc.Latin1.parse('')
        // 将明文转换成WordArray
        var contentWA = UCrypto.parse(acontent);
        // 加密 选定mode是CFB类型，无偏移量
        var encrypted = CryptoJS.AES.encrypt(contentWA, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }); 
        // 将密文转回uint8数组
        var bv = UCrypto.stringify(encrypted.ciphertext);
        return bv;
    }

    static decryptU8arry(array): any {
       let u8arr = new Uint8Array(array)
        var key = CryptoJS.enc.Latin1.parse(UCrypto.aeskey);
        var iv = CryptoJS.enc.Latin1.parse('')
        // var key = "0000000000000000";
        var acontent = u8arr;
        // 将密文转换成WordArray
        var contentWA = UCrypto.parse(acontent);
        // // 插件要求密文是base64格式
        var dcBase64String = CryptoJS.enc.Base64.stringify(contentWA);
        // UDebug.log("dcbase64String:"+dcBase64String)

        // 解密 选定mode是CFB类型，无偏移量
        var decrypted = CryptoJS.AES.decrypt(dcBase64String, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
        // 将解密后的明文转回uint8数组
        var bv = UCrypto.stringify(decrypted);
        return bv;
    }



    /////////////////////////////////////////////// rsa
    static genKeyPair() {
        // let bits = UCrypto.bits;
        // let genKeyPair:any = {};
        // UCrypto.thisKeyPair = new JSEncrypt({ default_key_size: bits, log: true });

        // genKeyPair.privateKey = UCrypto.thisKeyPair.getPrivateKey();
        // genKeyPair.publicKey = UCrypto.thisKeyPair.getPublicKey();
        // return genKeyPair;
    }

    static resDecrypt (ciphered): string {
        // [window as any]["crypto"] = {};
        if(cc.sys.isNative)
        {
            (window as { crypto: any}).crypto = {};
            window.crypto.getRandomValues = function ( array : any ) {      
                
                for (var i = 0, l = array.length; i < l; i++) {  
                    
                    array[i] = Math.floor(Math.random() * 256);  
                }  
                
                return array;  
            } 
        }
       
        // let crypt = new JSEncrypt()
        let pubkey = this.Unit8ArrayToString(ciphered)
        let rc4 = this.ramdonString()
        UCrypto.aeskey = rc4
        const crypto1 = require('crypto')
        let enc = crypto1.publicEncrypt({key:pubkey,padding:crypto1.constants.RSA_PKCS1_PADDING},new Buffer(rc4)).toString('base64');
        if(enc)
        {
            UCrypto.isAes = true
        }else{
            UCrypto.isAes = false
        }
        return enc;
    }

    static Unit8ArrayToString(arr:Uint8Array)
    {
        var dataString = "";
        for (var i = 0; i < arr.length; i++) {
          dataString += String.fromCharCode(arr[i]);
        }
       
        return dataString
    }

    static ramdonString()
    {
        let str:string = "0123456789abcdefghijklmnopqrstuvwxyz"
        let newstr = ""
        let len = 16
        let str_len = str.length
        for(let i=0;i<len;i++)
        {
            let n = Math.floor(Math.random()*str_len)
            if(i == 0 &&　n < 10)
            {
                n+=Math.floor(Math.random()*20)
                newstr += str[n]
            }else{
                newstr += str[n]
            }
           
           
        }
        return newstr
    }
}