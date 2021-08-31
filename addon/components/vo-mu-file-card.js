import { action } from '@ember/object';
import Component from '@glimmer/component';

export default class VoMuFileCardComponent extends Component {
  get active() {
    // @active defaults to true
    return 'active' in this.args ? this.args.active : true;
  }

  get downloadable() {
    // @downloadable defaults to true
    return 'downloadable' in this.args ? this.args.downloadable : true;
  }

  @action
  delete(event) {
    event.preventDefault();
    this.args.onDelete(this.args.file);
  }
}
