function isJP() {
  return (Session.getActiveUserLocale() === 'ja');
}

function onOpen(event) {
  var ui = SlidesApp.getUi();
  
  Logger.log(Session.getActiveUserLocale());
  
  ui.createMenu(isJP() ? 'ロボット' : 'Robot')
      .addItem(isJP() ? 'シナリオを保存' : 'Save Scenario', 'saveScenarioOnly')
      .addItem(isJP() ? 'シナリオと画像を保存' : 'Save Scenario & Images', 'saveScenarioAndImages')
      .addToUi();
}

function onInstall(event) {
  onOpen(event);
}

function saveScenarioOnly() {
  saveScenario(true);
}

function saveScenarioAndImages() {
  saveScenario(false);
}

function saveScenario(scenarioOnly) {
  var ui = SlidesApp.getUi();

  var result = ui.prompt(
    (scenarioOnly) ? (isJP() ? 'シナリオを保存しますか？' : 'Do you save scenario ?') :  (isJP() ? 'シナリオと画像を保存しますか？' : 'Do you save scenario and images ?'),
     isJP() ? '名前を変えて保存する場合は、ファイル名を入力してください。' : 'If you want to change name, input filename.',
     ui.ButtonSet.OK_CANCEL);

  var presentation = SlidesApp.getActivePresentation();
  var presentationName = presentation.getName();

  var button = result.getSelectedButton();
  var text = result.getResponseText();
  if (button == ui.Button.OK) {
    saveScenarioSlideImages(text ? text : presentationName, scenarioOnly);
  } else if (button == ui.Button.CANCEL) {
  } else if (button == ui.Button.CLOSE) {
  }
}

function downloadSlide(folder, name, presentationId, slideId) {
  var url = 'https://docs.google.com/presentation/d/' + presentationId + '/export/jpeg?id=' + presentationId + '&pageid=' + slideId;
  Logger.log(url);
  var options = {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    }
  };
  var response = UrlFetchApp.fetch(url, options);
  var image = response.getAs(MimeType.JPEG);
  image.setName(name);
  folder.createFile(image);
}

function saveScenarioSlideImages(presentationName, scenarioOnly) {
  var presentation = SlidesApp.getActivePresentation();
  var scenario = [];
  var folder = DriveApp.createFolder(presentationName);
  presentation.getSlides().forEach(function(slide, i) {
    var pageName = Utilities.formatString('%03d', i+1)+'.jpeg';
    scenario.push('/quiz.slide/images/'+folder+'/'+pageName);
    //scenario.push(':quiz.slide/{{{slideName}}}'+pageName);
    //scenario.push(':quiz.slide/'+presentationName+'/'+pageName);
    //scenario.push(':1s');
    //scenario.push('\n')
    var txt = '';
    slide.getNotesPage().getShapes().forEach(function(shape, i) {
      txt += shape.getText().asString();
    });
    
    var note = [];
    var space = [];
    txt.split('\n').map( function(t) { return t.trim() } ).forEach( function(v) {
      if (v == '') {
        note.push(v);
        //space.push(v);
      } else {
        var wait = (note.length > 0 && note.slice(-1)[0].match(/(.+)[。？]$/)!=null) ? 1 : 0;
        if (space.length > 0) {
          wait += space.length;
        }
        if (v.indexOf(':')==0) {
          wait = 0;
        }
        //if (wait > 0) note.push(':'+wait+'s');
        if (wait > 0) {
          for (var i=0;i<wait;i++) {
            note.push('');
          }
        }
        if (space.length > 0) {
          //note.push('');
          space = [];
        }
        note.push(v);
      }
    });

    var wait = (note.length > 0 && note.slice(-1)[0].match(/(.+)[。？]$/)!=null) ? 1 : 0;
    scenario = scenario.concat(note);
    if (wait) {
      //scenario.push(':2s')
      //scenario.push('\n')
      //scenario.push('\n')
    }
    //scenario.push('\n')
    //scenario.push('\n')

    if (!scenarioOnly) {
      //downloadSlide(folder, presentationName+'.'+pageName, presentation.getId(), slide.getObjectId());
      downloadSlide(folder, pageName, presentation.getId(), slide.getObjectId());
    }
  });
  folder.createFile(presentationName+'-scenario.txt',scenario.join('\n'));
}
