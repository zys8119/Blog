class CalendarDataJs {
    /**
     @公元前的算法：
     年干=8-N(N﹤8)或8-N+10(N≧8)，N=年号除以10的余数=年号个位数。
     年支=10-N(N<10)或10-N+12(N≧10)，N=年号除以12的余数。

     @公元后的算法：
     年干=N-3(N>3)或N-3+10(N≤3)，N=年号除以10的余数=年号个位数。
     年支=N-3(N>3)或N-3+12(N≤3)，N=年号除以12的余数。
     */
    config = {
        // 天干
        tg:[
            {name: "甲", code: "（jiǎ）",},
            {name: "乙", code: "（yǐ）",},
            {name: "丙", code: "（bǐng）",},
            {name: "丁", code: "（dīng）",},
            {name: "戊", code: "（wù）",},
            {name: "己", code: "（jǐ）",},
            {name: "庚", code: "（gēng）",},
            {name: "辛", code: "（xīn）",},
            {name: "壬", code: "（rén）",},
            {name: "癸", code: "（guǐ）",},
        ],
        // 地支
        dz:[
            {name: "子", sx: "鼠", code: "（zǐ）",},
            {name: "丑", sx: "牛", code: "（chǒu）",},
            {name: "寅", sx: "虎", code: "（yín）",},
            {name: "卯", sx: "兔", code: "（mǎo）",},
            {name: "辰", sx: "龙", code: "（chén）",},
            {name: "巳", sx: "蛇", code: "（sì）",},
            {name: "午", sx: "马", code: "（wǔ）",},
            {name: "未", sx: "羊", code: "（wèi）",},
            {name: "申", sx: "猴", code: "（shēn）",},
            {name: "酉", sx: "鸡", code: "（yǒu）",},
            {name: "戌", sx: "狗", code: "（xū）",},
            {name: "亥", sx: "猪", code: "（hài）",},
        ],
        // 月干
        month:{
            "甲、己": ["丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉", "甲戌", "乙亥", "丙子", "丁丑",],
            "乙、庚": ["戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未", "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑",],
            "丙、辛": ["庚寅", "辛卯", "壬辰", "癸巳", "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑",],
            "丁、壬": ["壬寅", "癸卯", "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",],
            "戊、癸": ["甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥", "甲子", "乙丑",],
        },
        // 日干支推算表
        // 月数表，日柱公式： 日干支序数=年数+月数+日期 （和大于60，则减60。1月、2月用上一年的年数）
        monthNb:[6,37,0,31,1,32,2,33,4,34,5,25],
        dayNb: {10: "癸酉", 11: "甲戌", 12: "乙亥", 13: "丙子", 14: "丁丑", 15: "戊寅", 16: "己卯", 17: "庚辰", 18: "辛巳", 19: "壬午", 20: "癸未", 21: "甲申", 22: "乙酉", 23: "丙戌", 24: "丁亥", 25: "戊子", 26: "己丑", 27: "庚寅", 28: "辛卯", 29: "壬辰", 30: "癸巳", 31: "甲午", 32: "乙未", 33: "丙申", 34: "丁酉", 35: "戊戌", 36: "己亥", 37: "庚子", 38: "辛丑", 39: "壬寅", 40: "癸卯", 41: "甲辰", 42: "乙巳", 43: "丙午", 44: "丁未", 45: "戊申", 46: "己酉", 47: "庚戌", 48: "辛亥", 49: "壬子", 50: "癸丑", 51: "甲寅", 52: "乙卯", 53: "丙辰", 54: "丁巳", 55: "戊午", 56: "己未", 57: "庚申", 58: "辛酉", 59: "壬戌", 60: "癸亥", 1: "甲子", 2: "乙丑", 3: "丙寅", 4: "丁卯", 5: "戊辰", 6: "己巳", 7: "庚午", 8: "辛未", 9: "壬申"},
        NumString: "一二三四五六七八九十",
        MonString: "正二三四五六七八九十冬腊",
        yearNumArr: {},
        max:0,
    }

    constructor() {
        this.config.max = Object.keys(this.config.dayNb).length;
        this.config.yearNumArr = this.getYearNum(2022, this.config.dz.length);
    }

    /**
     * 判断是否为闰年
     * @param year 年份
     */
    is_leap(year) {
        return (year%100==0?(year%400==0?1:0):(year%4==0?1:0));
    }

    /**
     * 判断月份大小并返回当月天数
     * @param Month 月份
     * @param dateYear 年份
     */
    is_Month(Month,dateYear){
        dateYear = dateYear || new Date().getFullYear();
        var dateindex = 31;if(Month % 2 == 0){dateindex = 30;if(Month == 2){(this.is_leap(dateYear))?dateindex = 29:dateindex = 28;};};if(Month >= 8){(Month % 2 == 0)?dateindex = 31:dateindex = 30;};return dateindex;
    }

    /**
     * 返回日历数据
     * @param dateYear 年份
     * @param dateMonth 月份
     */
    returnDate(dateYear,dateMonth){
        var initData = new Date();
        dateYear = dateYear || initData.getFullYear();
        dateMonth = dateMonth || initData.getMonth()+1;
        var dateDay = new Date(dateYear,dateMonth-1,1).getDay(),//星期
            dateindex = this.is_Month(dateMonth,dateYear),
            DayData = new Array(42),
            newDayAll = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
            newDayAllIndex = 0;
        for(var i = 0 ; i < DayData.length ; i++){
            if(i % 7 == 0){
                newDayAllIndex = 0;
            }else{
                newDayAllIndex ++;
            };
            DayData[i] = {
                week:newDayAllIndex,
                name:newDayAll[newDayAllIndex],
                Explain:"说明：" +
                    "==@ LunarCalendar：当天对应的农历；"+
                    "==@ dateDayIndex：该参数是指当月的1号的索引值为dateDayIndex，即"+dateDay+
                    "==@ day：当天号数；"+
                    "==@ getDayAll：当天总日期；"+
                    "==@ getDateIdex：参数为当月总天数；"+
                    "==@ getDateIdex_Lastmonth：参数为上月总天数；"+
                    "==@ getDateIdex_Nextmonth：参数为下月总天数；"+
                    "==@ name：当天星期数【文字】（星期一/星期六）；"+
                    "==@ week：当天星期数【数字】（0-6）；",
                dateDayIndex:dateDay,
                getDateIdex:this.is_Month(dateMonth,dateYear),
                getDateIdex_Lastmonth:this.is_Month(dateMonth-1,dateYear),
                getDateIdex_Nextmonth:this.is_Month(dateMonth+1,dateYear)
            };
            var returnLunarDateToB_index = 0;
            if(i >= dateDay && i < dateindex+dateDay){
                DayData[i].day = i-dateDay+1;
            }else if(i < dateDay){
                DayData[i].day = this.is_Month(dateMonth-1,dateYear)-dateDay+i+1;
                switch (dateindex){
                    case 30:
                        DayData[i].day = this.is_Month(dateMonth-1,dateYear)-dateDay+i+1;
                        break;
                    case 31:
                        DayData[i].day = this.is_Month(dateMonth,dateYear)-dateDay+i;
                        if(dateMonth == 8 || dateMonth == 3){
                            DayData[i].day = this.is_Month(dateMonth-1,dateYear)+1-dateDay+i;
                        };
                        if(dateMonth == 1){
                            DayData[i].day = this.is_Month(12,dateYear)+1-dateDay+i;
                        };
                        break;
                };
                returnLunarDateToB_index = -1;
            }else{
                DayData[i].day = i-dateindex-dateDay+1;
                returnLunarDateToB_index = 1;
            };
            DayData[i].dateYear = (function(){
                var dateMonth2 = dateMonth+returnLunarDateToB_index;
                if(dateMonth2 > 12){
                    return dateYear+1;
                }else if(dateMonth2 < 1){
                    return dateYear-1;
                }
                return dateYear;
            })();
            DayData[i].dateMonth = (function(){
                var dateMonth2 = dateMonth+returnLunarDateToB_index;
                if(dateMonth2 > 12){
                    return 1;
                }else if(dateMonth2 < 1){
                    return 12;
                }
                return dateMonth2;
            })();
            DayData[i].LunarCalendar = this.getLunarCalendar(DayData[i].dateYear,DayData[i].dateMonth,DayData[i].day);
            DayData[i].getDayAll = DayData[i].dateYear+"-"+DayData[i].dateMonth+"-"+DayData[i].day;
        };
        return DayData;
    }

    /**
     * 百度【天干地支纪年法】,获取农历
     * @param dateA 年
     * @param dateB 月
     * @param dateC 日
     */
    getLunarCalendar(dateA, dateB, dateC){
        const initData = new Date();
        dateA = dateA || initData.getFullYear();
        dateB = dateB || initData.getMonth()+1;
        dateC = dateC || initData.getDate();

        const year_tg = this.config.tg[this.getN(dateA, this.config.tg.length) - 1];
        const year_dz = this.config.dz[this.getN(dateA, this.config.dz.length) - 1];
        // @ts-ignore
        const monthObj = this.config.month[Object.keys(this.config.month).find(e=>e.indexOf(year_tg.name) > -1)];
        const month = monthObj[dateB - 1];
        // console.log((dateA % 5 -  2) *2 -1 + 10, monthObj)
        // @ts-ignore
        let yearNb = this.config.yearNumArr[([1,2].includes(dateB) ? (dateA - 1) : dateA)];
        let monthNb = this.config.monthNb[dateB - 1];
        let daySum = yearNb+monthNb + dateC;
        if(daySum > this.config.max){
            daySum -= this.config.max;
        }
        const day = this.config.dayNb[daySum];
        return {
            yearNb,
            monthNb,
            daySum,
            args:[dateA,dateB,dateC],
            year_tg,
            year_dz,
            month,
            day,
            month_str:this.config.MonString[monthObj.indexOf(month)]
        }
    }
    // 获取年数
    getYearNum(targetYear, max){
        const res = {};
        let base = {
            year:1000,
            num:31
        };
        if(targetYear > base.year){
            for(let k = base.year+1; k <= targetYear; k++){
                if(this.is_leap(k)){
                    base.num += 6;
                }else {
                    base.num += 5;
                }
                res[k] = base.num % 60;
            }
        }else {
            for(let k = base.year-1; k >= targetYear; k--){
                if(this.is_leap(k + 1)){
                    base.num -= 6;
                }else {
                    base.num -= 5;
                }
                res[k] = base.num > 0 ? base.num : 60 - Math.abs(base.num % 60);
            }
        }
        return res;
    }
    // 获取年干或年支
    getN(year, num){
        let N = year % num;
        if(N > 3){
            N = N -3
        }else {
            N = N -3 + num
        }
        return N;
    }
}

//http://www.5igb.com/wnl.htm?TZ=%2B0800+%B1%B1%BE%A9%A1%A2%D6%D8%C7%EC%A1%A2%BA%DA%C1%FA%BD%AD&SY=2022&SM=2
const d = new CalendarDataJs();
// const  res = d.returnDate(2020,2)
// console.log(res.map(e=>e.LunarCalendar))
console.log(d.getLunarCalendar(2022,2,3))
console.log(d.config.yearNumArr[1900])
console.log(d.getLunarCalendar(1900,1,31))
