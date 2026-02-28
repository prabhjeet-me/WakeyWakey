import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AgentState } from './orb-component.type';

@Injectable()
export class OrbComponentService {
  readonly state = new Subject<AgentState>();

  /**
   * Set state of orb
   */
  setState(state: AgentState) {
    this.state.next(state);
  }
}
