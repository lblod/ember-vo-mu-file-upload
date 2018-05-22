import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from '../templates/components/vo-mu-file-card';
export default Component.extend({
  layout,
  classNames: ["upload__files upload__files--has-files"],
  active: true,

  downloadLink: computed('file', function(){
    return `/files/${this.file.get('id')}/download?name=${this.file.get('filename')}`;
  }),

  actions: {
    delete(){
      this.get('onDelete')(this.get('file'));
    }
  }
});
