/*
 *  Majiang.Util.xiangting
 */
"use strict";
/*
    https://blog.kobalab.net/entry/20150329/1427637532
    https://blog.kobalab.net/entry/20151216/1450191666
    https://blog.kobalab.net/entry/20151217/1450357254
*/

function _xiangting(m, d, g, j) {
    /*
        m: 面子
        d: 搭子
        g: 孤立牌
        j: 将頭
    */

    let n = j ? 4 : 5;
    if (m         > 4) { d += m     - 4; m = 4         } // 面子が4を超えた分は搭子とする
    if (m + d     > 4) { g += m + d - 4; d = 4 - m     } // 搭子もあわせて4を超えた分は単張とする
    if (m + d + g > n) {                 g = n - m - d } // 孤立牌のうち切らなくてよいもの
    if (j) d++;                                          // 将頭も搭子と対等にカウント
    return 13 - m * 3 - d * 2 - g;
}

function dazi(bingpai) {

    let n_pai = 0, n_dazi = 0, n_guli = 0;

    for (let n = 1; n <= 9; n++) {
        n_pai += bingpai[n];
        if (n <= 7 && bingpai[n+1] == 0 && bingpai[n+2] == 0) { // 搭子となりえない位置でカット
            n_dazi += n_pai >> 1;                               // 左から貪欲に搭子を取り、残りは孤立牌
            n_guli += n_pai  % 2;
            n_pai = 0;
        }
    }
    n_dazi += n_pai >> 1;
    n_guli += n_pai  % 2;

    return { a: [ 0, n_dazi, n_guli ],
             b: [ 0, n_dazi, n_guli ] };
}

function mianzi(bingpai, n = 1) {
    /*
        bingpai: 兵牌
        n: ランク (1-origin)
    */

    if (n > 9) return dazi(bingpai); // 搭子を取る

    let max = mianzi(bingpai, n+1); // nを使わない

    if (n <= 7 && bingpai[n] > 0 && bingpai[n+1] > 0 && bingpai[n+2] > 0) { // 順子があれば取る
        bingpai[n]--; bingpai[n+1]--; bingpai[n+2]--;
        let r = mianzi(bingpai, n);
        bingpai[n]++; bingpai[n+1]++; bingpai[n+2]++;
        r.a[0]++; r.b[0]++;
        if (r.a[0]* 2 + r.a[1] > max.a[0]* 2 + max.a[1]) max.a = r.a;       // a: 向聴数計算式ベース
        if (r.b[0]*10 + r.b[1] > max.b[0]*10 + max.b[1]) max.b = r.b;       // b: 面子優先
    }

    if (bingpai[n] >= 3) {                                                  // 刻子があれば取る
        bingpai[n] -= 3;
        let r = mianzi(bingpai, n);
        bingpai[n] += 3;
        r.a[0]++; r.b[0]++;
        if (r.a[0]* 2 + r.a[1] > max.a[0]* 2 + max.a[1]) max.a = r.a;
        if (r.b[0]*10 + r.b[1] > max.b[0]*10 + max.b[1]) max.b = r.b;
    }

    return max;
}

function mianzi_all(shoupai, jiangpai) {

    // 数牌
    let r = {
        m: mianzi(shoupai._bingpai.m),
        p: mianzi(shoupai._bingpai.p),
        s: mianzi(shoupai._bingpai.s),
        // {a: [面子, 搭子, 孤立牌], b: [面子, 搭子, 孤立牌]}
    };

    // 字牌
    let z = [0, 0, 0];
    for (let n = 1; n <= 7; n++) {
        if      (shoupai._bingpai.z[n] >= 3) z[0]++;
        else if (shoupai._bingpai.z[n] == 2) z[1]++;
        else if (shoupai._bingpai.z[n] == 1) z[2]++;
    }

    let n_fulou = shoupai._fulou.length;

    let min = 13;

    // 総当たり
    for (let m of [r.m.a, r.m.b]) {
        for (let p of [r.p.a, r.p.b]) {
            for (let s of [r.s.a, r.s.b]) {
                // 簡易計算 (総当たりにより、いずれかは正しい)
                let x = [n_fulou, 0, 0];
                for (let i = 0; i < 3; i++) {
                    x[i] += m[i] + p[i] + s[i] + z[i];
                }
                let n_xiangting = _xiangting(x[0], x[1], x[2], jiangpai);
                if (n_xiangting < min) min = n_xiangting;
            }
        }
    }

    return min;
}

function xiangting_yiban(shoupai) {

    // 将頭なし
    let min = mianzi_all(shoupai);

    for (let s of ['m','p','s','z']) {
        let bingpai = shoupai._bingpai[s];
        for (let n = 1; n < bingpai.length; n++) {
            if (bingpai[n] >= 2) { // 将頭あり
                bingpai[n] -= 2;
                let n_xiangting = mianzi_all(shoupai, true);
                bingpai[n] += 2;
                if (n_xiangting < min) min = n_xiangting;
            }
        }
    }
    if (min == -1 && shoupai._zimo && shoupai._zimo.length > 2) return 0;

    return min;
}

function xiangting_guoshi(shoupai) {

    if (shoupai._fulou.length) return Infinity;

    let n_yaojiu = 0;
    let n_duizi  = 0;

    for (let s of ['m','p','s','z']) {
        let bingpai = shoupai._bingpai[s];
        let nn = (s == 'z') ? [1,2,3,4,5,6,7] : [1,9];
        for (let n of nn) {
            if (bingpai[n] >= 1) n_yaojiu++;
            if (bingpai[n] >= 2) n_duizi++;
        }
    }

    return n_duizi ? 12 - n_yaojiu : 13 - n_yaojiu;
}

function xiangting_qidui(shoupai) {

    if (shoupai._fulou.length) return Infinity;

    let n_duizi = 0;
    let n_guli  = 0;

    for (let s of ['m','p','s','z']) {
        let bingpai = shoupai._bingpai[s];
        for (let n = 1; n < bingpai.length; n++) {
            if      (bingpai[n] >= 2) n_duizi++;
            else if (bingpai[n] == 1) n_guli++;
        }
    }

    if (n_duizi          > 7) n_duizi = 7;
    if (n_duizi + n_guli > 7) n_guli  = 7 - n_duizi;

    return 13 - n_duizi * 2 - n_guli;
}

function xiangting(shoupai) {
    return Math.min(
        xiangting_yiban(shoupai),
        xiangting_guoshi(shoupai),
        xiangting_qidui(shoupai)
    );
}

function tingpai(shoupai, f_xiangting = xiangting) {

    if (shoupai._zimo) throw new Error(shoupai);

    let pai = [];
    let n_xiangting = f_xiangting(shoupai);
    for (let s of ['m','p','s','z']) {
        let bingpai = shoupai._bingpai[s];
        for (let n = 1; n < bingpai.length; n++) {
            if (bingpai[n] >= 4) continue;
            bingpai[n]++;
            if (f_xiangting(shoupai) < n_xiangting) pai.push(s+n);
            bingpai[n]--;
        }
    }
    return pai;
}

module.exports = {
    xiangting_guoshi: xiangting_guoshi,
    xiangting_qidui:  xiangting_qidui,
    xiangting_yiban:  xiangting_yiban,
    xiangting:        xiangting,
    tingpai:          tingpai
}
