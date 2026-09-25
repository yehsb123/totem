# DB 스키마 (MongoDB)

모델 정의: `apps/api/src/db/models/*.ts` · 응답 변환: `apps/api/src/db/serialize.ts` · API 계약: `packages/shared/src/*.ts`

## 원칙

1. **조직(organization) 단위 격리** — 코스·투어·리뷰·일정·구독·결제는 모두 `organizationId` 를 갖고, API 는 토큰의 조직으로만 조회·수정한다. 다른 조직 데이터는 404 로 응답한다(존재 여부도 알리지 않음).
2. **공용 데이터** — 장소(`places`)와 관광 통계(`tourism_stats`)는 조직과 무관하다.
3. **삭제** — 사용자·코스·투어는 `deletedAt` 으로 삭제 표시(soft delete)만 해서 작성자·연결 참조가 깨지지 않게 한다. 탈퇴 시 개인정보(이메일·이름·전화·인증수단)는 즉시 지운다.
4. **비밀값은 해시만** — 비밀번호(bcrypt), refresh token·인계 코드(SHA-256). 원문은 DB 에 없다.
5. **스냅샷** — 코스에 담긴 장소는 장소 캐시가 바뀌어도 저장 당시 모습이 보이도록 필요한 필드를 복사해 둔다.

## 컬렉션 ↔ 화면

| 컬렉션 | 화면 | 설명 |
|---|---|---|
| `organizations` | 회원가입(회사 이름) | 테넌트. 가입자가 owner |
| `users` | 로그인·회원가입·설정 > 계정/알림 | 계정 |
| `sessions` | (로그인 유지) | refresh token 세션, 만료 시 TTL 자동 삭제 |
| `auth_handoffs` | 메인 → 콘솔 이동 | 1회용 로그인 인계 코드, 60초 TTL |
| `invitations` | 설정 > 멤버 관리, 메인 /invite | 조직 초대 링크(토큰 해시), 7일 만료, 이력 보존 |
| `subscriptions` | 설정 > 결제 정보 상단 | 조직당 1건 |
| `payments` | 설정 > 결제 내역 | |
| `places` | 코스메이커 좌측 목록·지도 | TourAPI 동기화 캐시 (공용) |
| `courses` | 코스메이커 | 일차별 시간대 슬롯 |
| `tours` | 투어관리 표, 리뷰관리 목록 | 코스를 운영하는 회차 |
| `reviews` | 리뷰관리 하단 표 | |
| `review_imports` | 리뷰관리 > CSV로 리뷰 저장 | 가져오기 이력 |
| `schedule_labels` | 일정관리 라벨 | 가입 시 기본 3개(투어·미팅·휴무) |
| `schedule_events` | 일정관리 달력 | |
| `tourism_stats` | 대시보드 6개 탭 | 지역·월 1건 (공용) |

## 필드

### organizations
| 필드 | 타입 | 비고 |
|---|---|---|
| name | string | 필수, ≤100 |
| plan | `trial`·`basic`·`pro` | 기본 trial. 메인 `/pricing` 요금제와 1:1 (Basic ₩29,000 · Pro ₩59,000, `PLAN_MONTHLY_PRICE`) · subscriptions.plan 과 항상 같은 값 |
| ownerId | ObjectId → users | |
| deletedAt | Date? | 소유자 단독 탈퇴 시 |
| purgedAt | Date? | 영구 삭제 완료 시각 — 이후 이름을 지운 표지로만 남음 |

index: (deletedAt, purgedAt) — 영구 삭제 대상 찾기

### users
| 필드 | 타입 | 비고 |
|---|---|---|
| organizationId | ObjectId → organizations | 필수, index |
| email | string? | 소문자. **문자열일 때만 unique** (탈퇴·카카오 무이메일 계정은 null) |
| passwordHash | string? | bcrypt, 조회 기본 제외. 카카오 전용 계정은 null |
| name | string | ≤50 |
| phone | string? | 아이디 찾기(name+phone index) |
| role | `owner`·`admin`·`member` | |
| status | `active`·`suspended`·`withdrawn` | active 외에는 모든 API 401/403 |
| identities[] | {provider:`local`·`kakao`, providerUserId} — 현재 가입 경로가 만드는 것은 `kakao` 뿐 | (provider, providerUserId) unique |
| notifications | {email: bool, push: bool} | 기본 true / false |
| agreements | {terms, privacy, marketing: Date?} | 약관 동의 시각 (증빙) |
| lastLoginAt, deletedAt | Date? | |

index: email unique(부분: 문자열만) + **email 조회용 일반 인덱스** (email, _id) — 부분 인덱스는 평범한 `{ email }` 조회에 쓰이지 않아 로그인·가입이 전체 스캔하던 문제 (AUDIT §18) · (name, phone) · organizationId

### sessions
| 필드 | 타입 | 비고 |
|---|---|---|
| userId | ObjectId → users | index |
| tokenHash | string | unique, SHA-256 |
| expiresAt | Date | **TTL index** — 만료 시 자동 삭제 |
| revokedAt | Date? | 로그아웃·회전·비밀번호 변경·탈퇴 시 |
| replacedByHash | string? | 회전된 토큰. 이 값이 있는데 옛 토큰이 다시 오면 탈취로 보고 전 세션 폐기 |
| userAgent, ip | string? | |

### auth_handoffs
codeHash(unique) · userId(index — 조직 영구 삭제 시 정리) · expiresAt(**TTL**) · usedAt — 조건부 업데이트로 1회만 사용

### invitations
organizationId · email(소문자) · role(`admin`·`member`) · tokenHash(unique, 원문은 생성 응답에만) · invitedBy · expiresAt(7일) · acceptedAt · acceptedUserId · revokedAt
- 상태는 필드로 계산: accepted > revoked > expired > pending. 이력 보존을 위해 TTL 삭제하지 않음
- 같은 이메일 재초대 시 이전 대기 초대는 취소(재발급). 수락은 조건부 업데이트로 1회만
- 권한: 초대·취소 = 관리자 이상(관리자 초대는 소유자만) · 역할 변경·소유권 이전 = 소유자 · 제외 = 관리자 이상(관리자 제외는 소유자만)
- 멤버 제외 = 탈퇴와 같은 개인정보 삭제 + 세션 폐기 → 이메일이 비워져 재초대 가능

### subscriptions / payments
- subscriptions: organizationId(**unique**) · plan(`trial`·`basic`·`pro`) · status(`trialing`·`active`·`past_due`·`canceled`) · currentPeriodEnd(=다음 결제일) · paymentMethod{brand,last4} (카드번호·빌링키 저장 안 함)
- payments: organizationId · paidAt · product · amount(원) · currency(KRW) · status(`paid`·`failed`·`refunded`) · externalId(PG 거래ID) — index (organizationId, paidAt↓)

### places (공용)
| 필드 | 타입 | 비고 |
|---|---|---|
| source + contentId | string | **unique 쌍** (`tourapi`·`manual`) — 구 스키마의 중복 적재 문제 해결 |
| category | `attraction`·`restaurant`·`hotel`·`cafe`·`etc` | TourAPI contentTypeId 로 분류 (39+소분류 A05020900=카페) |
| title, addr1, addr2, zipcode, tel | string | |
| areaCode, sigunguCode, cat1~3, contentTypeId | string | 제주 areaCode=39 |
| mapX / mapY | number | 경도 / 위도 |
| imageUrl, thumbnailUrl | string? | |
| popularity / foreignPopularity | number | 코스에 담길 때 +1 (코스 nation 이 KR 이면 popularity, 아니면 foreign) |
| isActive, syncedAt | | |

index: category, (areaCode, category, popularity↓), text(title, addr1)

### courses
| 필드 | 타입 | 비고 |
|---|---|---|
| organizationId, createdBy | ObjectId | |
| title | string | ≤100 |
| pickupLocation, note | string | |
| startDate, endDate | `YYYY-MM-DD` | 시작 ≤ 종료, 최대 31일 |
| nation | `KR`·`JP`·`CN`·`TW`·`HK`·`US`·`SEA`·`EU`·`OTHER` | |
| timeSlots | string[] | 기본 16칸, 0번 = `(숙소)` |
| days[] | {dayNumber, date, slots[]} | 기간의 모든 날짜를 1일차부터 빠짐없이 |
| days[].slots[] | {slotIndex, place(스냅샷), memo} | 빈 칸은 저장하지 않음. 숙소는 0번에만, 0번엔 숙소만 |
| deletedAt | Date? | |

### tours
| 필드 | 타입 | 비고 |
|---|---|---|
| organizationId, createdBy | ObjectId | |
| courseId | ObjectId? → courses | |
| title, type(기본 "일반"), nation, note | | 타입 드롭다운 = 조직 내 distinct(type) |
| startDate, endDate | `YYYY-MM-DD` | |
| status | `planned`·`in_progress`·`completed`·`canceled` | 화면: 예정·진행중·종료·취소 |
| managerName | string | 담당자 |
| capacity / bookedSeats | number | 예상 / 예약 인원. bookedSeats ≤ capacity. 잔여 = 차이(응답에서 계산) |
| reviewStats | {ratingSum, count} | 리뷰 등록·삭제 시 `$inc` — 목록 N+1 조회 제거 |
| deletedAt | Date? | |

### reviews / review_imports
- reviews: organizationId · tourId · reviewerName? · totalRating(1~5 필수) · restaurant/accommodation/attraction/guideRating(1~5?) · comment? · source(`manual`·`csv`) · importBatchId? · fingerprint?(tourId+행 내용 해시, **(tourId,fingerprint) unique** → 같은 CSV 재가져오기 중복 방지) · submittedAt
- review_imports: organizationId · tourId · csvUrl · totalRows · imported · skipped · errors[{row,message}] · createdBy — index (organizationId, tourId, createdAt↓)

### schedule_labels / schedule_events
- labels: organizationId · name(**조직 내 unique**) · emoji · color(`blue`·`red`·`purple`·`green`·`yellow`·`teal`·`indigo`·`pink`·`gray`) · defaultPlace · defaultManager
- events: organizationId · labelId? · tourId? · name · startDate · endDate · manager · items[{time `HH:mm`, place}] · note · createdBy — index (organizationId, startDate, endDate): 달력 범위 조회 `startDate ≤ to AND endDate ≥ from`
- 사용 중인 라벨 삭제는 409, `?reassignTo=<labelId|none>` 로 옮긴 뒤 삭제

### tourism_stats (공용)
region · month(`YYYY-MM`) — **(region, month) unique** · source(기본 `한국관광데이터랩`, 출처 표기)
| 필드 | 대시보드 탭 |
|---|---|
| domesticVisitors, genderAge[{ageGroup, maleRatio, femaleRatio}] | 방문자 통계(국내) |
| internationalVisitors, countryRatios[{country, ratio}] | 국가별 관광 방문객 수 |
| snsMentions, companionTypes[{name,value}], travelTypes[{name,value}] | 소셜미디어 언급량 |
| domesticSpending{total, byCategory[{category, amount}]} | 관광소비(국내) |
| internationalSpending{total, byCategory[…]} | 관광소비(국외) |
| (위 합계) | 종합 현황판 — `/dashboard/overview` 가 계산 |

시드: 2024-07 ~ 2025-06 (12개월, 구 콘솔 정적 데이터 이관). 새 달 추가는 같은 형식으로 upsert.

## 조직 삭제·데이터 보존

| 단계 | 언제 | 무엇이 일어나나 |
|---|---|---|
| 1. 삭제 표시 | 소유자가 혼자 남은 상태에서 탈퇴 | `organizations.deletedAt`, 대기 초대 취소, 소유자 개인정보 즉시 삭제. 이후 **모든 요청·로그인 401**("삭제된 조직입니다.") |
| 2. 유예 | `ORG_PURGE_AFTER_DAYS`(기본 30일) | 데이터는 남아 있지만 누구도 접근 불가 (복구 요청 대응 기간) |
| 3. 영구 삭제 | 개발 `npm run purge -w @totem/api` / 운영 이미지 `node dist/db/purge-run.js` (하루 1회 예약 실행, docs/DEPLOY.md) | 코스·투어·리뷰·가져오기 이력·일정·라벨·초대·구독·사용자·세션·인계 코드 삭제. 조직 문서는 이름을 지운 표지(`purgedAt`)로만 남김 |
| 보존 | 5년 (목표) | `payments` — 전자상거래법 대금결제 기록 보존. 개인정보 없음. **5년 경과분 삭제는 아직 구현하지 않음**(현재는 계속 보존) — 보존 기간 확정 후 purge 에 추가 |

멤버 제외·개인 탈퇴는 조직과 무관하게 **즉시** 개인정보(이메일·이름·전화·인증수단)를 지우고 세션을 폐기한다.

## 시드

| 명령 | 내용 |
|---|---|
| `npm run seed` (운영 이미지는 `node dist/db/seed/run.js`) | 공용 데이터(통계 12개월·제주 장소 17곳) upsert. `SEED_DEMO_PASSWORD` 가 있으면 데모 조직도 |
| 개발 서버(`MONGO_URI` 비움) | 인메모리 DB 에 공용 데이터 + 데모 조직 자동. 계정 `demo@totem.dev` / `demo1234` |
| `SEED_ON_EMPTY=true` + 영속 DB | 비어 있으면 공용 데이터. 데모 조직은 `SEED_DEMO_PASSWORD` 가 있을 때만 (알려진 기본 비밀번호는 인메모리 전용) |

데모 조직: 코스 1 · 투어 3(예정·진행중·종료) · 리뷰 3 · 일정 3 · Basic 구독 · 결제 3건(₩29,000)

가입 직후 조직은 `trial`/`trialing` (무료로 시작하기). 체험 기간 길이는 미정 → 결제 연동 시 결정
