// =============================================
// НОМЕР ВЕРСИИ ИГРЫ — менять ТОЛЬКО здесь
// =============================================
// Он показывается в углу экрана и добавляется к адресам файлов
// (например game.js?v=0.6). Новая версия — новый адрес, поэтому
// iPad не возьмёт старый файл из кэша, а скачает свежий.
const VERSION = 'v0.7.1';

// Подключает файлы с меткой версии. Файлы грузятся строго по порядку списка.
function loadWithVersion(files) {
  const tag = VERSION.replace('v', '');   // 'v0.6' → '0.6'
  for (const file of files) {
    if (file.endsWith('.css')) {
      document.write('<link rel="stylesheet" href="' + file + '?v=' + tag + '">');
    } else {
      document.write('<script src="' + file + '?v=' + tag + '"><\/script>');
    }
  }
}
