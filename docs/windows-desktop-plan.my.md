# DBMaps Windows Offline Desktop Plan

အခြေအနေ: သဘောတူထားသော design plan အတိုင်း implementation စတင်ထားပြီး release စစ်ဆေးမှုများ လုပ်ဆောင်နေသည်။

## ရည်ရွယ်ချက်

Windows x64 တွင် internet မလိုဘဲ install လုပ်၍ DBMaps editor သုံးနိုင်ရန်။ `.dbml` ဖိုင်တစ်ဖိုင်ထဲ schema နှင့် diagram layout သိမ်းနိုင်ရန်။ Code သို့မဟုတ် database ပြောင်းခြင်းကို ဤ planning အဆင့်တွင် မလုပ်ပါ။

## လက်ရှိအခြေအနေ

- Vue + Vite app၊ browser storage တွင် project များ သိမ်းထားသည်။
- `src/utils/dbmlParser.js` တွင် DBML parse/generate/validate ရှိသည်။
- `src/utils/projectBackup.js` တွင် version 1 `.dbmap.json` backup validation ရှိသည်။
- `src/stores/schemaStore.js` တွင် import၊ project state၊ local save နှင့် DBML update များရှိသည်။
- `src/components/Navbar.vue` တွင် menu actions ရှိသည်။
- `D:/slh/proj/drawio/rust-desktop` တွင် Rust + GPUI Kit + Wry/WebView2၊ embedded assets၊ bundled runtime နှင့် Inno Setup installer နမူနာရှိသည်။ ၎င်း၏ Open with က snapshot ဖွင့်ပြီး Save As သုံးသောကြောင့် DBMaps ၏ မူလဖိုင်သို့ Save လုပ်နိုင်မှုကို သီးခြားတည်ဆောက်ရမည်။
- `.specify/` နှင့် setup-plan script မရှိသဖြင့် Spec Kit workflow၊ constitution gates နှင့် hooks ကို မလုပ်ဆောင်နိုင်သေး။ ဤဖိုင်သည် standalone plan ဖြစ်သည်။

## ဆုံးဖြတ်ချက်များ

လက်ရှိ Vue editor ကို ပြန်သုံး၍ Rust desktop host ထဲ production assets ထည့်မည်။ Drawio project ၏ desktop နည်းလမ်းကို reference အဖြစ်သုံးပြီး DBMaps လိုအပ်ချက်နှင့် မဆိုင်သော diagram logic ကို မယူပါ။ Desktop build သည် editor သို့ တိုက်ရိုက်ဝင်မည်။ Web deployment ၏ routing နှင့် import/export ကို ဆက်ထိန်းမည်။

Windows installer တွင် WebView2 runtime ထည့်မည်။ Installer သည် per-user install၊ Start menu shortcut၊ uninstall နှင့် `.dbml` Open with registration ပေးမည်။ Windows default application ကို အတင်းမပြောင်းပါ။ Installer/build dependency download သည် build machine တွင် လိုနိုင်သော်လည်း ဖြန့်ဝေပြီး installer နှင့် app သည် offline အလုပ်လုပ်ရမည်။

## Document ဖိုင် contract

ဖိုင်သည် UTF-8 text DBML ဖြစ်မည်။ JSON project ကို `.dbml` ဟု နာမည်ပြောင်းသိမ်းခြင်း မလုပ်ပါ။ DBMaps layout ကို version ပါသော single-line DBML comment အဖြစ် ထည့်မည်။ အဆိုပြု format:

```dbml
// dbmaps-layout: {"version":1,"tables":{"public.users":{"x":120,"y":80}}}

Table public.users {
  id int [pk]
}
```

ဤ marker သည် အဆိုပြု contract ဖြစ်ပြီး လက်ရှိ parser နှင့် အခြား DBML parser တို့၏ comment support စစ်ပြီးမှ implementation တွင် အတည်ပြုမည်။ JSON ကို compact single-line serialize လုပ်၍ string ထဲ newline များ escape လုပ်ရမည်။ Metadata block တစ်ခုသာ ရှိရမည်။ ထပ်နေသော marker ကို တိတ်တဆိတ် မရွေးဘဲ warning ပြမည်။

- Layout table key သည် parser နှင့်ကိုက်ညီသော schema-qualified table identity ဖြစ်မည်။ Schema မပါသော name ကို မည်သို့ normalize လုပ်မည်ကို parser code အပေါ် အခြေခံ၍ သတ်မှတ်မည်။
- Document တည်းဖြတ်နေစဉ် လက်ရှိ table identity ဖြင့် နေရာထိန်းမည်။ Rename လုပ်သောအခါ metadata key ကိုပါ လိုက်ပြောင်းမည်။ Columns ပြင်ခြင်းကြောင့် layout မပျောက်ရ။
- Version 1 တွင် table positions နှင့် လက်ရှိ app မှ round-trip လုပ်ရန်လိုသော group/display state ကိုသာ ထည့်မည်။ အမှန်တကယ် persisted fields များကို state inventory ပြီးမှ သတ်မှတ်မည်။ မလိုအပ်သော UI state မသိမ်းပါ။
- Metadata မှ position များသည် finite numbers ဖြစ်ရမည်။ Object shape၊ version နှင့် table references ကို validate လုပ်မည်။ မရှိသော table ၏ metadata ကို diagram object အဖြစ် မဖန်တီးပါ။
- Layout မပါသော DBML ကို auto-layout နှင့်ဖွင့်မည်။ Layout ပျက်နေခြင်း/unsupported version ဖြစ်လျှင် schema ကို ဆက်ဖွင့်၍ warning ပြမည်။ မသိသော metadata ကို overwrite မလုပ်မီ layout ဆုံးရှုံးနိုင်ကြောင်း ပြပြီး Save As လမ်းကြောင်းပေးမည်။
- DBML schema parse မအောင်မြင်လျှင် လက်ရှိဖွင့်ထားသော document ကို မအစားထိုးပါ။ Original file ကို မပြောင်းပါ။
- User ရေးထားသော DBML comments နှင့် syntax ကို ဖြစ်နိုင်သမျှ မူလ text အတိုင်းထိန်းမည်။ Layout-only edit/save က schema ကို ပြန် generate လုပ်၍ supported မဖြစ်သော syntax ဖျက်မိခြင်း မရှိရ။ Visual schema edit များ၏ လက်ရှိ text synchronization လမ်းကြောင်းကို အရင်စစ်မည်။
- အခြား tool က comments ဖျက်ပြီး ပြန်သိမ်းလျှင် layout ပျောက်နိုင်သည်။ Schema သည် သီးခြားအသုံးပြုနိုင်ရမည်။

## ဖိုင်လုပ်ဆောင်မှု contract

Desktop host က native picker နှင့် file I/O ကို ကိုင်တွယ်မည်။ Renderer မှ arbitrary filesystem path ပေး၍ ဖတ်/ရေးနိုင်သည့် API မဖွင့်ပါ။ Native picker သို့မဟုတ် OS launch ဖြင့် ရွေးထားသော document ကိုသာ host မှ ထိန်းထားမည်။ Remote navigation နှင့် untrusted content မှ native bridge ခေါ်နိုင်မှုကို ပိတ်မည်။

| လုပ်ဆောင်ချက် | အပြုအမူ |
| --- | --- |
| New | Unsaved document အသစ်၊ လက်ရှိ document dirty ဖြစ်လျှင် အရင်မေးမည် |
| Open / Ctrl+O | Picker မှ `.dbml` ဖတ်၊ validate အောင်မြင်မှ document အစားထိုးမည် |
| Save / Ctrl+S | လက်ရှိ file path တွင်သိမ်း၊ path မရှိလျှင် Save As |
| Save As / Ctrl+Shift+S | နေရာရွေး၍ သိမ်း၊ အောင်မြင်မှ current path ပြောင်းမည် |
| OS Open with | Space/Unicode ပါသော path ကိုလက်ခံ၊ ပထမဗားရှင်းတွင် file တစ်ခုကို window အသစ်ဖြင့်ဖွင့်မည် |
| Close | Dirty ဖြစ်လျှင် Save / Discard / Cancel၊ Save cancel/error ဖြစ်လျှင် မပိတ်ရ |

Schema နှင့် persisted layout ပြောင်းခြင်း နှစ်ခုလုံး dirty ဖြစ်မည်။ Browser localStorage save အောင်မြင်ခြင်းက document file သိမ်းပြီးဟု မယူဆရ။ File write အောင်မြင်သော revision ကိုသာ clean သတ်မှတ်မည်။ Save လုပ်နေစဉ် ထပ်ပြင်ထားသော revision ရှိလျှင် dirty ဆက်ဖြစ်ရမည်။

Save တွင် destination folder ထဲ ယာယီဖိုင်ရေးပြီး Windows တွင် သင့်လျော်သော replace operation ဖြင့် အစားထိုးမည်။ Permission၊ disk-full၊ target lock နှင့် replace failure ဖြစ်လျှင် မူလဖိုင်ကို မဖျက်ပါ။ Error ကို user မြင်ရပြီး edited state ဆက်ရှိရမည်။ Open ပြီးနောက် အခြား program က disk file ပြောင်းထားလျှင် တိတ်တဆိတ် overwrite မလုပ်ဘဲ reload/cancel သို့မဟုတ် Save As လမ်းကြောင်းပေးမည်။

## လက်ရှိ data နှင့် compatibility

Web browser storage၊ sample projects နှင့် `.dbmap.json` backup format ကို မပြောင်းပါ။ Desktop document ၏ အဓိကသိမ်းရာသည် `.dbml` ဖြစ်မည်။ Browser profile နှင့် desktop WebView profile မတူသောကြောင့် web projects ကို အလိုအလျောက် migrate မလုပ်ပါ။ လက်ရှိ backup export/import ဖြင့် ရွှေ့နိုင်ပုံကို docs ထဲ ရေးမည်။ Database migration၊ real database connection သို့မဟုတ် SQL execution မပါဝင်ပါ။

## Implementation အစီအစဉ်

1. Parser/import/export callers၊ backup fixtures၊ project/table identities၊ layout fields၊ storage watchers နှင့် menu shortcuts ကို inventory လုပ်မည်။ Raw DBML preservation နှင့် web regression အတွက် နမူနာများ သတ်မှတ်မည်။
2. DBML comment metadata read/write ကို shared utility တွင် အနည်းဆုံးထည့်၍ plain DBML၊ metadata round-trip၊ rename၊ malformed/unsupported/duplicate metadata စမ်းသပ်မည်။ လက်ရှိ backup validator pattern ကို ပြန်သုံးမည်။
3. Rust host ထည့်၍ Vite output၊ static assets၊ custom origin နှင့် editor entry ကို ချိတ်မည်။ Absolute asset paths နှင့် routing သည် offline host တွင် မှန်ကန်ကြောင်း စစ်မည်။
4. Native Open/Save/Save As၊ file launch arguments၊ dirty state နှင့် close confirmation ကို editor/store/menu နှင့် ချိတ်မည်။ File failures နှင့် external modifications ကို ကိုင်တွယ်မည်။
5. DBMaps icon/app identity၊ bundled WebView2၊ Inno Setup installer၊ file registration၊ build/run instructions ထည့်မည်။ Drawio installer ၏ app ID နှင့် storage directory ကို မပြန်သုံးပါ။
6. Offline Windows စက်တွင် end-to-end စစ်ပြီး installer၊ version နှင့် checksum ပေးမည်။ Signing မရှိလျှင် Windows warning ဖြစ်နိုင်မှုကို release notes တွင် ရှင်းမည်။
7. အောက်ပါ release စံနှုန်းများ ပြည့်မီလျှင် project ၏ GitHub repository တွင် DBMaps Desktop 1.0 release ထုတ်မည်။

## GitHub version 1.0 release

ပထမ stable Windows desktop release ကို **DBMaps Desktop 1.0** ဟုခေါ်၍ Git tag ကို `v1.0.0` သုံးမည်။ App version၊ Rust package version၊ installer version နှင့် release notes ကို `1.0.0` နှင့် ကိုက်ညီအောင် ထားမည်။ Layout metadata ၏ `version: 1` သည် file format version ဖြစ်ပြီး app release version နှင့် သီးခြားဖြစ်သည်။

Release မတင်မီ အတည်ပြုရမည့်အချက်များ:

- ဤ plan ၏ လက်ခံစစ်ဆေးမှုအားလုံး အောင်မြင်ပြီး စမ်းသပ်ခဲ့သော Windows version၊ build commit နှင့် ရလဒ်များ မှတ်တမ်းရှိရမည်။ Data loss ဖြစ်စေနိုင်သော bug နှင့် release ပိတ်ဆို့သော failure များ မကျန်ရ။
- Git remote မှ ရည်ရွယ်ထားသော repository ကို အတည်ပြု၍ ရှိပြီးသား `v1.0.0` tag/release ရှိမရှိ စစ်မည်။ ရှိပြီးသား release ကို overwrite သို့မဟုတ် tag ရွှေ့ခြင်း မလုပ်ဘဲ desktop tag အမည်ကို user နှင့် သတ်မှတ်မည်။
- နောက်ဆုံးစမ်းသပ်အောင်မြင်သော commit ကို tag ချိတ်ပြီး ထို source မှ build လုပ်ထားသော installer ကိုသာ ဖြန့်မည်။
- Bundled runtime နှင့် ပြန်သုံးထားသော dependency များအတွက် လိုအပ်သည့် license/notice များ ထည့်မည်။ Signing ရှိ/မရှိနှင့် Windows warning ဖြစ်နိုင်မှုကို မှန်ကန်စွာ ဖော်ပြမည်။

GitHub Release တွင် ပါဝင်မည့်ဖိုင်များ:

| ဖိုင် | ရည်ရွယ်ချက် |
| --- | --- |
| `DBMaps-Setup-1.0.0-x64.exe` | WebView2 ပါသော Windows offline installer |
| `SHA256SUMS.txt` | ဖြန့်ဝေမည့် installer ၏ SHA-256 checksum |
| `example.dbml` | Schema နှင့် layout ပါသော စမ်းဖွင့်နိုင်သည့် နမူနာ၊ ကိုယ်ရေး/အဖွဲ့အစည်း data မပါရ |

Release notes တွင် supported Windows versions၊ offline install/open/save လုပ်နည်း၊ web project ကို backup ဖြင့် ရွှေ့နည်း၊ `.dbml` layout comments ကန့်သတ်ချက်၊ signing အခြေအနေနှင့် သိရှိထားသော ပြဿနာများကို ဖော်ပြမည်။ Release draft ကို အရင်ပြင်ဆင်၍ assets နှင့် checksum ကို စစ်ပြီး စံနှုန်းများပြည့်မှ stable release အဖြစ် publish လုပ်မည်။ စစ်ဆေးမှုမအောင်မြင်လျှင် stable 1.0 မထုတ်သေးဘဲ ပြဿနာကို ဖြေရှင်းမည်။

ဤအဆင့်သည် အနာဂတ် implementation ပြီးနောက် release ထုတ်မည့် plan ဖြစ်သည်။ လက်ရှိ plan ပြင်ဆင်မှုတွင် commit/tag/push သို့မဟုတ် GitHub publish မလုပ်ပါ။

## ထိမည့်နေရာများ

- `src/utils/dbmlParser.js` နှင့် DBML import/export ခေါ်သုံးသော components/utilities။
- `src/stores/schemaStore.js`၊ menu/shortcut နှင့် document close လမ်းကြောင်း။
- `src/components/Navbar.vue` နှင့် လက်ရှိ import/export UI လိုအပ်ရာများ။
- `vite.config.ts`၊ `package.json` တွင် desktop build လိုအပ်ချက်သာ။
- အသစ်ထည့်မည့် `rust-desktop/` host၊ installer၊ icons နှင့် build configuration။
- DBML fixtures/self-checks နှင့် README desktop instructions။
- `src/utils/projectBackup.js` ကို compatibility စစ်မည်။ လိုအပ်ချက်မရှိလျှင် မပြောင်းပါ။

## လက်ခံစစ်ဆေးမှု

- Internet ပိတ်ထားပြီး WebView2 မရှိသော supported Windows x64 test environment တွင် install၊ launch၊ edit၊ save၊ reopen အောင်မြင်ရမည်။
- Schema နှင့် table positions သည် save/reopen ပြီး တူညီရမည်။ Layout-only save က schema text/comments မဖျက်ရ။
- Plain DBML၊ schema-qualified names၊ rename၊ group/display state နှင့် Unicode file path များ စမ်းသပ်မည်။
- Layout မမှန်ခြင်း၊ unsupported version၊ duplicate marker၊ schema မမှန်ခြင်းသည် original file/document မပျက်စေရ။
- Save cancellation၊ locked/read-only file၊ failed replace နှင့် external file change တို့သည် data loss မဖြစ်စေရ။
- Save အတွင်း ထပ်ပြင်ခြင်း၊ unsaved close/New/Open နှင့် OS launch စမ်းသပ်မည်။
- Installer upgrade/uninstall က user `.dbml` documents မဖျက်ရ။ Open with entry နှင့် path quoting မှန်ရမည်။
- လက်ရှိ web build/lint နှင့် import/export/backup flow များ စစ်မည်။ Metadata ပါသော `.dbml` ကို သီးခြား DBML parser ဖြင့် စစ်မည်။

## Scope အပြင်နှင့် သိထားရမည့်အချက်များ

Cloud sync၊ auto-update၊ multi-tab workspace၊ macOS/Linux installers နှင့် automatic browser-data migration မပါဝင်ပါ။ Bundled WebView2 သည် installer size တိုးစေပြီး security updates အတွက် release အသစ်ဖြင့် runtime ပြန်ဖြန့်ရန်လိုသည်။ Runtime size၊ startup performance နှင့် Windows compatibility ကို build စမ်းပြီးမှ အတည်ပြုနိုင်မည်။

လက်ရှိအဆင့်: Implementation နှင့် conditional GitHub release အတွက် user ညွှန်ကြားချက်ရရှိပြီးဖြစ်သည်။ Release စစ်ဆေးမှုအားလုံး အောင်မြင်မှ version 1.0 ထုတ်မည်။
