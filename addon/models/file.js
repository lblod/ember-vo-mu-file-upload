import Model from '@ember-data/model';
import { attr } from '@ember-data/model';
import { computed } from '@ember/object';

export default Model.extend({
  filename: attr(),
  format: attr(),
  size: attr(),
  extension: attr(),
  created: attr('datetime'),

  humanReadableSize: computed('size', function () {
    //ripped from https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
    const bytes = this.size;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }),

  downloadLink: computed('filename', 'id', function () {
    return `/files/${this.id}/download?name=${this.filename}`;
  }),
});
