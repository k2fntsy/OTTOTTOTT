
### Step 0: GitHub에 코드 올리기
Vercel에 연결하기 전, 먼저 코드가 GitHub에 올라가 있어야 합니다.

1. **GitHub 로그인** 후 [New Repository](https://github.com/new)를 생성합니다 (이름: `ott-aggregator` 등).
2. **로컬 터미널**에서 다음 명령어를 순서대로 입력합니다:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: OTT Aggregator with Mobile UI"
   git branch -M main
   git remote add origin https://github.com/사용자아이디/저장소이름.git
   git push -u origin main
   ```
   *(이미 깃을 사용 중이라면 `remote` 설정 후 `push`만 하시면 됩니다.)*

### Step 1: Vercel에서 프로젝트 가져오기
1. [Vercel Dashboard](https://vercel.com/dashboard)로 이동합니다.
2. **"Add New..."** 버튼을 누르고 **"Project"**를 선택합니다.
3. 방금 생성한 GitHub 저장소를 찾아 **"Import"** 버튼을 클릭합니다.
4. **Environment Variables** (환경 변수) 설정 섹션을 펼칩니다.
2. **Environment Variables** 설정 섹션에 다음 항목들을 추가합니다:
   - `VITE_SUPABASE_URL`: (로컬 `.env`에 있는 값)
   - `VITE_SUPABASE_ANON_KEY`: (로컬 `.env`에 있는 값)
   - `VITE_TMDB_API_KEY`: (로컬 `.env`에 있는 값)
3. 'Deploy' 버튼을 누르면 배포 완료! (제공되는 `.vercel.app` 주소로 접속 가능)

---

## 2. 데이터 자동 업데이트 (GitHub Actions)
매일 아침 06시에 `ingestor.ts`를 자동으로 실행하기 위해 **GitHub Actions**를 사용합니다.

### 설정 방법:
1. 프로젝트 루트에 `.github/workflows/update_data.yml` 파일을 작성합니다 (아래 템플릿 참조).
2. GitHub 저장소의 **Settings > Secrets and variables > Actions**에서 다음 Secrets를 추가합니다:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (RLS를 우회하여 쓰기 권한을 가지기 위해 필요)
   - `TMDB_API_KEY`

### `.github/workflows/update_data.yml` 템플릿:
```yaml
name: Daily Data Ingestion
on:
  schedule:
    # 매일 한국 시간 오전 06시 (UTC 21:00)
    - cron: '0 21 * * *'
  workflow_dispatch: # 수동 실행 버튼 활성화

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - name: Run Ingestor
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}
        run: npx tsx scripts/ingestor.ts
```

---

## 3. 주의사항 (보안)
- **Supabase Key**: 프론트엔드 배포 시에는 `ANON_KEY`를 사용하고, 인제스터 스크립트(GitHub Actions)에서는 `SERVICE_ROLE_KEY`를 사용해야 보안이 유지됩니다.
- **TMDB API**: 배포된 주소에 상관없이 API 호출은 정상 작동합니다.
