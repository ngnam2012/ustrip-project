def get_momo_mock_html(amount: float, success_url: str, return_url: str, payment_status: str) -> str:
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MoMo Mock</title>
<style>
*{{box-sizing:border-box}}
body{{font-family:system-ui,-apple-system,sans-serif;background:#fff0f7;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}}
.c{{background:white;padding:32px;border-radius:24px;box-shadow:0 15px 50px #a5006420;text-align:center;max-width:420px;width:100%}}
h1{{color:#a50064;margin-top:0}}
p{{color:#555;line-height:1.6}}
.amount{{font-size:1.5em;font-weight:800;color:#a50064;margin:16px 0}}
button{{background:#a50064;color:white;border:0;padding:16px 28px;border-radius:14px;font-weight:700;font-size:16px;cursor:pointer;width:100%;margin-top:8px;transition:background .2s}}
button:hover{{background:#870052}}
button:active{{transform:scale(0.98)}}
button:disabled{{background:#ccc;cursor:wait}}
.link{{display:inline-block;margin-top:18px;color:#a50064;font-weight:700;text-decoration:none}}
.link:hover{{text-decoration:underline}}
.success{{background:#ecfdf5;border:2px solid #10b981;border-radius:16px;padding:20px;margin-top:16px}}
.success h2{{color:#059669;margin:0 0 8px}}
.note{{font-size:13px;color:#999;margin-top:18px}}
</style>
</head>
<body>
<div class="c">
    <h1>MoMo Mock Sandbox</h1>
    <p class="amount">{amount:,.0f}đ</p>
    <p>Đóng góp vào quỹ chung UsTrip</p>
    <div id="actions">
        <button type="button" id="payBtn" onclick="doMockSuccess()">✓ Đánh dấu thanh toán thành công</button>
        <a class="link" href="{return_url}">← Quay lại UsTrip</a>
    </div>
    <div id="result" style="display:none"></div>
    <p class="note">Môi trường thử nghiệm · Không sử dụng tiền thật</p>
</div>
<script>
function doMockSuccess(){{
    var btn=document.getElementById('payBtn');
    btn.disabled=true;
    btn.textContent='Đang xử lý...';
    fetch('{success_url}',{{method:'POST',redirect:'manual'}}).then(function(){{
        document.getElementById('actions').style.display='none';
        document.getElementById('result').style.display='block';
        document.getElementById('result').innerHTML='<div class="success"><h2>✓ Thanh toán thành công!</h2><p>Đã ghi nhận đóng góp vào quỹ chung.</p></div><a class="link" href="{return_url.replace(f'status={payment_status}', 'status=success')}">← Quay lại UsTrip</a>';
    }}).catch(function(e){{
        btn.disabled=false;
        btn.textContent='Thử lại';
        alert('Lỗi: '+e.message);
    }})
}}
</script>
</body>
</html>"""
