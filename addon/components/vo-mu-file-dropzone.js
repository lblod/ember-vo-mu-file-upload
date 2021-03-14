import Component from '@ember/component';
import layout from '../templates/components/vo-mu-file-dropzone';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { A } from '@ember/array';
import { v4 } from "ember-uuid";

export default Component.extend({
  layout,
  fileQueue: service(),
  store: service(),
  uploadingMsg: computed('fileQueue.{files.length,progress}', function(){
    return `Bezig met het opladen van ${this.get('fileQueue.files.length')} bestand(en). (${this.get('fileQueue.progress')}%)`;
  }),
  multiple: true,
  classNames: ['upload js-upload js-upload-bound'],
  attributeBindings:['dataUploadAllowDrop:data-upload-allow-drop'],
  dataUploadAllowDrop:true,
  title: 'Bestanden toevoegen',
  helpTextDragDrop: 'Sleep de bestanden naar hier om toe te voegen',
  helpTextDrop: 'Laat de bestanden hier los om op te laden',
  helpTextFileNotSupported: 'Dit bestandsformaat wordt niet ondersteund.',
  endPoint: '/file-service/files',
  uploadErrorData: null,
  hasErrors: computed('uploadErrorData.[]', function(){
    return this.uploadErrorData.length > 0;
  }),
  maxFileSizeMB: 20,

  uploadFileTask: task(function * (file){
    this.notifyQueueUpdate();
    try {
      const response = yield file.upload(this.endPoint, {'Content-Type': 'multipart/form-data'});
      const uploadedFile = yield this.store.findRecord('file', response.body.data.id);
      return uploadedFile;
    }
    catch(e) {
      this.uploadErrorData.pushObject({filename: file.get('name')});
      this.removeFileFromQueue(file);
      return null;
    }
  }).maxConcurrency(3).enqueue(),

  init(){
    this._super(...arguments);
    this.set('uploadErrorData', A());
    this.set('queueName', `${v4()}-fileUploads`);
  },

  hasValidationErrors(file){
    if(file.size > this.maxFileSizeMB*Math.pow(1024, 2)){
      this.uploadErrorData.pushObject({filename: file.get('name'), error: `Bestand is te groot (max ${this.maxFileSizeMB} MB)`});
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
    let q = this.fileQueue.queues.find(q => q.get('name') === this.queueName);
    q.remove(file);
  },

  calculateQueueInfo(){
    const filesQueueInfo = { isQueueEmpty: this.uploadFileTask.state === 'idle' };
    return filesQueueInfo;
  },

  notifyQueueUpdate(){
    if(this.onQueueUpdate){
      this.onQueueUpdate(this.calculateQueueInfo());
    }
  },

  actions: {
    async upload(file){
      if(this.hasValidationErrors(file))
        return;
      let uploadedFile = await this.uploadFileTask.perform(file);

      this.notifyQueueUpdate();

      if(uploadedFile)
        this.onFinishUpload(uploadedFile, this.calculateQueueInfo());
    },
    onDrop(){
      this.resetErrors();
    }
  }
});
