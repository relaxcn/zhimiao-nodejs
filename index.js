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

// get template
async function getRequest(url) {
    let res = "";
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
        logger.error(e.message);
        process.exit(-1);
    }
    return res;
}


// 获取所有可接种日期的list
async function GetCustSubscribeDateAll(pid, id, month) {
    logger.info("GetCustSubscribeDateAll(" + `${pid}, ${id}, ${month})`);
    const url = URL.getSubscribeMonth_news + `&pid=${pid}&id=${id}&month=${month}`;
    logger.info(url);

    // get 请求
    let res = await getRequest(url);
    logger.info(res.body);
    // 如果还未开始，则一直循环 如果没有date
    while (res.body.indexOf("date") === -1) {
        // 延迟0.5s
        sleep(500);
        res = await getRequest(url);
        logger.info(res.body);
    }
    //while end

    let res_json = JSON.parse(res.body);
    return res_json["list"];
}

// 获取某个日期的详细加密密文
async function GetCustSubscribeDateDetail(scdate) {
    logger.info("GetCustSubscribeDateAll");
    // 构造url
    const url = URL.getSubscribeTime + `&pid=${cg.pid}&id=${cg.id}&scdate=${scdate}`
    logger.info(url)
    // get 请求
    let res = await getRequest(url);
    logger.info(res.body);
    // 如果还未开始，则一直循环
    while (res.body.indexOf("list") !== -1) {
        // 延迟0.5s
        sleep(500);
        res = await getRequest(url);
        logger.info(res.body);
    }
    //while end

    // console.log(res.statusCode, "\n");
    if (res.statusCode !== 200) {
        logger.error("Cookie 过期");
        logger.error(res.body);
        process.exit(-1);
    }
    
    // decode
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
    let mxid = "";
    try {
        mxid = JSON.parse(t)['list'][0]['mxid'];
    }
    catch (e) {
        logger.error(e.message);
        return false;
    }
    return mxid;
}


async function GetCaptcha(mxid) {
    logger.info("GetCaptcha");
    const url = URL.getMovCaptcha + `&mxid=${mxid}`;
    logger.info(url);
    let res = await getRequest(url);
    logger.info(res.body);
    cg.cookie = res.headers["set-cookie"];
    
    if (res.body.indexOf("201") !== -1) {
        process.exit(-1);
    }
}

// 返回加密后的post 数据
function PostData(mxid, key, scdate) {
    logger.info("PostData");
    var post_data = `{"birthday":"1998-06-23","tel":"18836253270","sex":2,"cname":"余蒙佳","doctype":1,"idcard":"412828199806235466","mxid":"${mxid}","date":"${scdate}","pid":"${cg.pid}","Ftime":1,"guid":""}`
   
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
    logger.info(url);
    let res = ""
    // logger.info("new Cookie:" + cg.cookie);
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
        console.log(e.message);
        process.exit(-1);
    }
    cg.cookie = res.headers["set-cookie"];
    logger.info(res.body);
}

// 验证
async function GetOrderStatus() {
    logger.info("GetOrderStatus");
    let url = URL.getOrderStatus;
    logger.info(url);
    let res = await getRequest(url);
    logger.info(res.body);
    return res.body;
}

// 一次预约
async function oneTasks (scdate) {

    logger.info("start=======" + `${scdate}====`)
    let key = getKey();
    let mxid = await GetCustSubscribeDateDetail(scdate);
    // mxid 不可获得
    if (mxid === false) {
        logger.error("mxid 不可获取！");
        return false;
    }
    logger.info("mxid = " + mxid);


    await GetCaptcha(mxid);
    let postData = await PostData(mxid, key, scdate);
    logger.info("加密后：" + postData);
    await OrderPost(mxid, key, postData);
    let info = await GetOrderStatus();
    if (info.indexOf("200") !== -1) {
        logger.info("成功！")
        return true;
    }
    else if (info.indexOf("300") !== -1) {
        logger.info("已有预约！");
        return true;
    }
    else {
        logger.error("失败：" + `${scdate}`);
        return false;
    }
}


async function Run(scdate) {
    // 如果知道具体日期，则执行下面单个
    if (scdate !== "null") {
        // 指定日期
        let result = await oneTasks(scdate);
        if (result === true) {
            process.exit(0);
        }
    }
    // 顺序预约
    logger.info("顺序预约============")
    let list = await GetCustSubscribeDateAll(cg.pid, cg.id, cg.month);
    for (let i = 0; i < list.length; i++) {
        let date = list[i]["date"];

        // 跳过刚才的日期
        if (date === scdate) {
            continue;
        }
        logger.info("开始日期： " + `${date}`);
        let result = await oneTasks(date);
        // 预约到则结束循环
        if (result === true) {
            process.exit(0);
        }
    }
}

async function Test() {
    GetCustSubscribeDateAll(51, 1921, 202203);
}



Run(cg.scdate);
// Test();





// console.log(getZTF())
// getKey();
// console.log(mxid)
//
// GetCaptcha(mxid);
