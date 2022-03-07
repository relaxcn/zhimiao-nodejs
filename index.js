import got from 'got';
import r from './cry.cjs'
import URL from './url.cjs'
import cg from './config.cjs'
import log4js from 'log4js'
var logger = log4js.getLogger();
logger.level = 'debug';

// 延时，毫秒
function sleep(delay) {
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        // 使用  continue 实现；
        continue;
    }
}


function getZTF() {
    const e = (Date.parse(new Date())) / 1e3 + "";
    return r.MD5("zfsw_" + e.substring(0, e.length - 1)).toString();
}

function getKey() {
    const cookie = cg.cookie.substring(18);
    const a = cookie.split('.');
    const buff = Buffer.from(a[1], 'base64');
    const str1 = buff.toString('utf-8');
    const js = JSON.parse(str1);
    const val = js['val'];
    const buff_1 = Buffer.from(val, 'base64');
    const str2 = buff_1.toString('utf-8');
    return str2.substring(9, 25);
}

async function GetCustSubscribeDateAll() {
    logger.info("GetCustSubscribeDateAll");
    // 构造url
    const url = URL.getSubscribeTime + `&pid=${cg.pid}&id=${cg.id}&scdate=${cg.scdate}`
    logger.info(url)
    let res = ""
    try {
        // get 请求
        res = await got.get(url,
            {
                headers: {
                    "Cookie": cg.cookie,
                    "User-Agent": cg.agent,
                    "zftsl": getZTF(),
                    "Referer": "https://servicewechat.com/wx2c7f0f3c30d99445/92/page-frame.html",
                }
            }
        );
    }
        // 捕获错误
    catch (e) {
        logger.error(e);
        process.exit(-1);
    }
    logger.info(res.body)
    // 如果还未开始
    while (res.body.indexOf("list") !== -1) {
        sleep(500);
        try {
            // get 请求
            res = await got.get(url,
                {
                    headers: {
                        "Cookie": cg.cookie,
                        "User-Agent": cg.agent,
                        "zftsl": getZTF(),
                        "Referer": "https://servicewechat.com/wx2c7f0f3c30d99445/92/page-frame.html",
                    }
                }
            );
        }
            // 捕获错误
        catch (e) {
            logger.error(e);
            process.exit(-1);
        }
        logger.info(res.body)
    }
    //while end

    // console.log(res.statusCode, "\n");
    if (res.statusCode !== 200) {
        logger.error("Cookie 过期");
        logger.error(res.body);
        process.exit(-1);
    }

    logger.info(getKey(), "\n");


    var a, i, c, d;
    var u = r.enc.Utf8.parse("1234567890000000");


    var t = (a = res.body, i = r.enc.Utf8.parse(getKey()), c = r.enc.Hex.parse(a),
        d = r.enc.Base64.stringify(c),
        r.AES.decrypt(d, i, {
        iv: u,
        mode: r.mode.CBC,
        padding: r.pad.Pkcs7
    }).toString(r.enc.Utf8));
    logger.info(t);
    return JSON.parse(t)['list'][0]['mxid'];
}


async function GetCaptcha(mxid) {
    logger.info("GetCaptcha");
    const url = URL.getMovCaptcha + `&mxid=${mxid}`;
    logger.info(url);
    let res = ""
    try {
        // get 请求
        res = await got.get(url,
            {
                headers: {
                    "Cookie": cg.cookie,
                    "User-Agent": cg.agent,
                    "zftsl": getZTF(),
                    "Referer": "https://servicewechat.com/wx2c7f0f3c30d99445/92/page-frame.html",
                }
            }
        );


    }
        // 捕获错误
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
    cg.cookie = res.headers["set-cookie"];
    logger.info(res.body);
    if (res.body.indexOf("201") !== -1) {
        process.exit(-1);
    }
}

// 返回加密后的post 数据
function PostData(mxid, key) {
    logger.info("PostData");
    var post_data = `{"birthday":"1998-06-23","tel":"18836253270","sex":2,"cname":"余蒙佳","doctype":1,"idcard":"412828199806235466","mxid":"${mxid}","date":"${cg.scdate}","pid":"${cg.pid}","Ftime":1,"guid":""}`
   
    logger.info(post_data);
    let data = r.enc.Utf8.parse(post_data)
    var u = r.enc.Utf8.parse("1234567890000000");
    var a = r.enc.Utf8.parse(key);
    var n = r.AES.encrypt(data, a, {
        iv: u,
        mode: r.mode.CBC,
        padding: r.pad.Pkcs7
    });
    return n.ciphertext.toString();
}


async function OrderPost(mxid, key, postData) {
    logger.info("OrderPost");
    let url = URL.submitScribe30;
    let res = ""
    logger.info("new Cookie:" + cg.cookie);
    try {
        // get 请求
        res = await got.post(url,
            {
                headers: {
                    "Cookie": cg.cookie,
                    "User-Agent": cg.agent,
                    "zftsl": getZTF(),
                    "content-type": "application/json",
                    "Connection": "keep-alive",
                    "Referer": "https://servicewechat.com/wx2c7f0f3c30d99445/92/page-frame.html",
                },
                body: postData
            }

        );

    }
        // 捕获错误
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
    cg.cookie = res.headers["set-cookie"];
    logger.info(res.body);
}


async function GetOrderStatus() {
    logger.info("GetOrderStatus");
    let url = URL.getOrderStatus;
    let res = "";
    try {
        // get 请求
        res = await got.get(url,
            {
                headers: {
                    "Cookie": cg.cookie,
                    "User-Agent": cg.agent,
                    "zftsl": getZTF(),
                    "content-type": "application/json",
                    "Connection": "keep-alive",
                    "Referer": "https://servicewechat.com/wx2c7f0f3c30d99445/92/page-frame.html",
                },
            }
        );

    }
        // 捕获错误
    catch (e) {
        console.log(e);
        process.exit(-1);
    }
    logger.info(res.body);
}


async function allTasks () {

    logger.info("start=======")
    let key = getKey();
    let mxid = await GetCustSubscribeDateAll();
    logger.info("mxid = " + mxid);


    await GetCaptcha(mxid);
    logger.info("mxid = " + mxid);
    let postData = await PostData(mxid, key);
    logger.info("加密后：" + postData);
    await OrderPost(mxid, key, postData);
    await GetOrderStatus();
}

allTasks();




// console.log(getZTF())
// getKey();
// console.log(mxid)
//
// GetCaptcha(mxid);
