$(function() {
    // 如果不是在微信内置环境内，添加accept属性
    // 微信内置环境好像不支持具体的accept属性
    if (!isWeChat()) {
        $('#imageInput').attr('accept', '".jpg,.jpeg,.tiff"');
    }

    // 生成高德地图
    const map = new AMap.Map('mapContainer', {
        resizeEnable: true,
        center: [116.397428, 39.90923],
        zoom: 15
    });

    // 地理编码
    // @see: https://lbs.amap.com/api/javascript-api/example/geocoder/multi-regeo
    const geocoder = new AMap.Geocoder();

    // 上传本地图片
    $('#imageInput').change(function(e) {
        clearPage();
        const file = e.target.files[0];

        //图片转base64编码
        var reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]); // 读出 base64
        reader.onloadend = function() {
            var imageURL = reader.result;
            // TODO: 显示图片
            $('#imageWrap').append(
                '<div class="col-4 upload"><img class="imageItem active" src="' +
                    imageURL +
                    '" /></div>'
            );
        };

        // 获取图片的元数据
        getImageMeta(file);
    });

    // 选择测试图片
    $('#imageWrap').on('click', '.imageItem', function() {
        if ($(this).hasClass('active')) {
            return;
        }
        clearPage();
        $(this).addClass('active');
        getImageMeta(this);
    });

    function getImageMeta(file) {
        EXIF.getData(file, function() {
            // 图片所有的元数据
            const _allMeta = EXIF.getAllTags(this);
            // 元数据文本
            const _dataTxt = EXIF.pretty(this);

            // 元数据回显
            const metaJsonDom = document.getElementById('metaJson');
            metaJsonDom.innerHTML = JSON.stringify(_allMeta);

            const metaTextDom = document.getElementById('metaText');
            metaTextDom.innerHTML = _dataTxt;

            // 拍照时间
            const createTime = _allMeta.DateTime;
            $('#imageCreateTime').text(createTime || '--');

            const LongitudeArry = _allMeta.GPSLongitude;
            const LatitudeArry = _allMeta.GPSLatitude;

            if (!LongitudeArry || !LatitudeArry) {
                alert('该图片没有找到位置信息 ಥ_ಥ');
                return;
            }

            // @see: https://www.cnblogs.com/sekon/p/4297180.html
            // 计算GPS经度
            const longLongitude =
                LongitudeArry[0].numerator / LongitudeArry[0].denominator +
                LongitudeArry[1].numerator / LongitudeArry[1].denominator / 60 +
                LongitudeArry[2].numerator /
                    LongitudeArry[2].denominator /
                    3600;
            const gpsLongitude = longLongitude.toFixed(8);

            // 计算GPS纬度
            const longLatitude =
                LatitudeArry[0].numerator / LatitudeArry[0].denominator +
                LatitudeArry[1].numerator / LatitudeArry[1].denominator / 60 +
                LatitudeArry[2].numerator / LatitudeArry[2].denominator / 3600;
            const gpsLatitude = longLatitude.toFixed(8);

            // gps坐标
            const gpsLnglatText = '[' + gpsLongitude + ',' + gpsLatitude + ']';
            console.log('gps坐标', gpsLnglatText);
            $('#gpsLnglat').text(gpsLnglatText);

            // gps转高德坐标
            // @see: https://lbs.amap.com/api/javascript-api/example/other-gaode/othertoamap
            const gpsLnglat = [gpsLongitude, gpsLatitude];

            // 显示GPS在地图上的定位坐标
            // var marker1 = new AMap.Marker({
            //     position: gpsLnglat,
            //     icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
            // });
            // map.add(marker1);
            // marker1.setLabel({
            //     offset: new AMap.Pixel(20, 20),
            //     content: 'GPS定位坐标'
            // });

            AMap.convertFrom(gpsLnglat, 'gps', function(status, result) {
                if (result.info === 'ok') {
                    var aMapLnglat = result.locations[0];

                    // 高德地图坐标
                    const aMapLnglatText =
                        '[' + aMapLnglat.lng + ',' + aMapLnglat.lat + ']';
                    console.log('高德地图坐标', aMapLnglatText);
                    $('#aMapLnglat').text(aMapLnglatText);

                    const marker = new AMap.Marker({
                        position: aMapLnglat,
                        icon:
                            'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
                    });
                    map.add(marker);
                    map.setCenter(aMapLnglat);

                    // 坐标 => 地址
                    // 设置标签
                    geocoder.getAddress(aMapLnglat, function(status, result) {
                        let address = '';
                        if (status === 'complete' && result.regeocode) {
                            address = result.regeocode.formattedAddress;
                        } else {
                            alert(JSON.stringify(result));
                        }

                        marker.setLabel({
                            offset: new AMap.Pixel(20, 20),
                            content: address || '拍照地点'
                        });

                        // 填充拍照地点
                        if (address) {
                            $('#imageCreateAddress').text(address);
                        }
                    });
                    // 设置点标记的动画效果，此处为弹跳效果
                    // marker.setAnimation('AMAP_ANIMATION_BOUNCE');
                }
            });
        });
    }

    function isWeChat() {
        const ua = window.navigator.userAgent.toLowerCase();
        return ua.indexOf('micromessenger') > -1;
    }

    /**
     * 清空数据
     */
    function clearPage() {
        // 清除地图上所有添加的覆盖物
        // @see: https://lbs.amap.com/api/javascript-api/example/common/overlay-clear
        map.clearMap();

        $('#imageWrap .imageItem').removeClass('active');
        $('#gpsLnglat').text('');
        $('#aMapLnglat').text('');
        $('#imageCreateTime').text('');
        $('#imageCreateAddress').text('');
        $('#metaText').text('');
        $('#metaJson').text('');
    }
});
