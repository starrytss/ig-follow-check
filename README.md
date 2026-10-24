# IG Auto Like

Instagram 名單比對工具 · 山姆蛋實驗室 SamEgg Lab

> 目前的功能是「IG回追檢查」  
> 專案名稱依作者命名為 IG Auto Like 本版本沒有自動按讚功能

從 [原始工具](https://samtss.com/tools/ig-follow-check/) 獨立整理的靜態開源版本

## 功能

- 匯入 Instagram 官方資料匯出的 JSON 或 HTML 名單
- 比對未回追 互相追蹤 你沒追蹤的粉絲與追蹤名單
- 支援多份 followers 分檔及缺漏檢查
- 搜尋帳號 分批顯示 複製名單與匯出 CSV
- 支援手機與電腦版面

不需要 Instagram 密碼 API key 伺服器或資料庫  
只依匯出檔案判斷 不會即時查詢 Instagram

## 開始使用

安裝 Node.js 20 或更新版本後

```sh
git clone https://github.com/starrytss/ig-auto-like.git
cd ig-auto-like
npm start
```

開啟 http://127.0.0.1:4173

本專案沒有 npm 相依套件 不需要執行 npm install  
也可以直接開啟 index.html 剪貼簿若無法使用會提供手動複製

## 匯入方式

1. 從 Instagram 帳號管理中心下載自己的「追蹤者和追蹤中」資料
2. 建議選 JSON 並使用所有時間範圍
3. 將下載檔解壓縮
4. 在左側選 following.json 右側一次選取全部 followers_*.json
5. 點「開始比對」並依需要切換分類 搜尋或匯出

也接受 HTML 格式 每個檔案上限40MB 合計80MB 每次最多100份  
結果取決於匯出時間 完整性及帳號更名等因素

## 隱私與安全

- 讀取的名單與比對結果只存在目前分頁的記憶體
- 不會把匯入資料寫入 localStorage IndexedDB 或伺服器
- 本獨立版本沒有分析追蹤器 外部字型 CDN 或後端 API
- 關閉或重新整理分頁後需重新匯入
- 主動匯出或複製後的檔案與剪貼簿由使用者自行保管
- 點擊帳號連結才會前往 Instagram 這時受該網站隱私政策規範
- 請勿將自己的匯出資料 密碼 cookie 或 token 提交到 GitHub

這是獨立工具 與 Instagram 或 Meta 沒有官方關聯

## 開發

```sh
npm test
```

| 路徑 | 用途 |
| --- | --- |
| index.html | 工具介面與操作說明 |
| assets/ig-follow-core.js | 解析 帳號驗證 比對與 CSV |
| assets/ig-follow-check.js | 檔案讀取 結果呈現 搜尋與匯出 |
| assets/ig-follow-check.css | 工具樣式 |
| assets/base.css | 獨立版本基礎樣式 |
| scripts/serve.cjs | 僅供本機開發的靜態伺服器 |
| tests/core.test.cjs | 核心邏輯與隱私相依檢查 |

可部署到任一靜態網站服務  
GitHub Pages 可在 Settings → Pages 選 Deploy from a branch → main → / (root)

本版本移除了原站的全站導覽 收藏 意見回饋與品牌圖片相依  
保留原始比對與檔案處理程式  
原始網站不受此獨立儲存庫影響 兩邊不會自動同步

## 來源

來源儲存庫：starrytss/samtss-lab  
來源版本：a01ccc747d0adaff4c915ba250651d00c5314164  
來源路徑：public/tools/ig-follow-check/ 與 public/assets/ig-follow-*.js / css  
獨立整理日期：2026-10-25

## 貢獻與授權

歡迎提出 Issue 或 Pull Request 詳見 [CONTRIBUTING.md](CONTRIBUTING.md)  
程式碼採 [MIT License](LICENSE) 授權  
山姆蛋實驗室與 SamEgg Lab 名稱不代表授予商標使用或官方背書
