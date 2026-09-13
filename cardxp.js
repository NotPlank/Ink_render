document.getElementById('cardxp-placeholder').innerHTML = `
    <div class="d-none d-lg-block xl-block">
        <div class="xp-v">
            <div class="xp-t"><span>Sin título</span>
                <div>
                    <div class="xp-btn">_</div>
                    <div class="xp-btn">❐</div>
                    <div class="xp-btn close">X</div>
                </div>
            </div>
            <div class="xp-c"> </div>
        </div>
    </div>
 <style>
        .xp-v {
            width: 350px;
            background-color: #ece9d8;
            border: 3px solid #bdbdbd;
            border-top: none;
            border-radius: 7px 7px 0 0;
            box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
            position:absolute;
            top: 60vh;
            left: 3vw;
            justify-content: center;
        }
        .xp-t {
            background: linear-gradient(to top, #666, #6d6d6d 10%, #b3b3b3 80%, #d4d4d4);
            padding: 5px 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #fff;
            font-weight: bold;
            font-size: 13px;
        }
        .xp-btn {
            width: 21px;
            height: 21px;
            border: 1px solid #fff;
            border-radius: 3px;
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: linear-gradient(135deg, #ccc, #919191);
            margin-left: 2px;
        }
        .xp-btn.close {
            background: linear-gradient(135deg, #ff7d59, #e12300);
            border-color: #ff9b7d;
        }
        .xp-c {
            background-color: #fff;
            margin: 2px;
            padding: 12px;
            border: 1px solid #7f9db9;
        }
    </style>
 `;