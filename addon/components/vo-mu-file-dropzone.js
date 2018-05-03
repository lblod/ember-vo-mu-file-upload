import Component from '@ember/component';
import layout from '../templates/components/vo-mu-file-dropzone';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { A } from '@ember/array';

export default Component.extend({
  layout,
  fileQueue: service(),
  store: service(),
  uploadingMsg: computed('fileQueue.files.length', 'fileQueue.progress', function(){
    return `Bezit met het opladen van ${this.get('fileQueue.files.length')} bestand(en). (${this.get('fileQueue.progress')}%)`;
  }),
  multiple: true,
  classNames: ['upload js-upload js-upload-bound'],
  attributeBindings:['dataUploadAllowDrop:data-upload-allow-drop'],
  dataUploadAllowDrop:true,
  accept: 'application/*,image/*,video/*,audio/*,text/*',
  queueName: 'fileUploads',
  title: 'Bestanden Toevoegen',
  helpTextDragDrop: 'Sleep de bestanden naar hier om toe te voegen',
  helpTextDrop: 'Laat de bestanden hier los om op te laden',
  helpTextFileNotSupported: 'Dit bestandsformaat wordt niet ondersteund.',
  maxConcurrentFiles: 3,
  endPoint: '/file-service/files',
  uploadErrorData: null,
  hasErrors: computed('uploadErrorData.[]', function(){
    return this.get('uploadErrorData').length > 0;
  }),
  uploadFileTask: null,
  maxFileSizeMB: 20,

  initUploadFileTask(){
    let uploadTask = task(function * (file){
      try {
        let response = yield file.upload(this.get('endPoint'), {'Content-Type': 'multipart/form-data'});

        let uploadedFile = yield this.get('store').findRecord('file', response.body.data.id);

        return uploadedFile;
      }
      catch(e) {
        this.get('uploadErrorData').pushObject({filename: file.get('name')});
        this.removeFileFromQueue(file);
      }
    }).maxConcurrency(this.get('maxConcurrentFiles')).enqueue();

    this.set('uploadFileTask', uploadTask);
  },

  init(){
    this._super(...arguments);
    this.initUploadFileTask();
    this.set('uploadErrorData', A());
  },

  hasValidationErrors(file){
    if(file.size > this.get('maxFileSizeMB')*Math.pow(1024, 2)){
      this.get('uploadErrorData').pushObject({filename: file.get('name'), error: 'File too large'});
      this.removeFileFromQueue(file);
      return true;
    }
    return false;
  },

  resetErrors(){
    this.set('uploadErrorData', A());
  },

  click(){
    this.resetErrors();
  },

  removeFileFromQueue(file){
    let q = this.get('fileQueue').queues.find(q => q.get('name') === this.get('queueName'));
    q.remove(file);
  },

  actions: {
    async upload(file){
      if(this.hasValidationErrors(file))
        return;
      let uploadedFile = await this.get('uploadFileTask').perform(file);

      if(uploadedFile)
        this.get('onFinishUpload')(uploadedFile);
    },
    onDrop(){
      this.resetErrors();
    }
  }
});
