import { Component, OnInit } from '@angular/core';
import { Pers } from 'src/Models/Pers';
import { Task, taskState } from 'src/Models/Task';
import { ActivatedRoute, Router } from '@angular/router';
import { PersService } from '../pers.service';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Ability } from 'src/Models/Ability';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css']
})
export class TaskDetailComponent implements OnInit {
  private unsubscribe$ = new Subject();

  isEditMode: boolean = false;
  isEditState: boolean = false;
  newState: taskState = new taskState();
  requrenses: string[] = Task.requrenses;
  weekDays: string[] = Task.weekDays;
  tsk: Task;
  tskAbility: Ability;

  constructor(private location: Location, private route: ActivatedRoute, public srv: PersService, private router: Router) { }

  setWeekDays(wd){
    let idx = this.tsk.tskWeekDays.indexOf(wd);

    if (idx == -1) {
      this.tsk.tskWeekDays.push(wd);
    }
    else {
      this.tsk.tskWeekDays.splice(idx, 1);
    }
  }

  /**
   * Добавить состояние к задаче.
   */
  addStateToTask() {
    if (this.isEditState) {
      return;
    }

    this.newState.img = this.srv.GetRndEnamy(this.tsk);
    this.tsk.states.push(this.newState);

    this.tsk.states = this.tsk.states.sort((a, b) => {
      return a.isDone === b.isDone ? 0 : b.isDone ? -1 : 1;
    });

    this.newState = new taskState();
  }

  upAbil() {
    if (this.tskAbility) {
      this.srv.changesBefore();

      this.srv.upAbility(this.tskAbility);

      this.srv.changesAfter(true);
    }
  }

  /**
   * Удалить состояние у задачи.
   * @param id Идентификатор задачи.
   */
  delState(id: string) {
    this.tsk.states = this.tsk.states.filter(n => { return n.id != id; });
  }

  /**
   * Сдвинуть задачу вниз.
   * @param i Индекс.
   */
  down(i: number) {
    if (this.tsk.states.length > i + 1) {
      let tmp = this.tsk.states[i];

      this.tsk.states[i] = this.tsk.states[i + 1];
      this.tsk.states[i + 1] = tmp;
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.tsk.states, event.previousIndex, event.currentIndex);
  }

  getDateString(tsk: Task) {
    if (tsk.date === undefined || tsk.date === null) {
      return "";
    }

    let date = new Date(tsk.date);

    let dt = date.toLocaleDateString([], { day: 'numeric', month: 'numeric' });

    // if (tsk.time) {
    //   dt += ' | ' + tsk.time;
    // }

    return dt;
  }

  getNewState() {
    this.newState = new taskState();
  }

  goBack() {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    if (!this.srv.pers) {
      this.router.navigate(['/main']);
    }

    const id = this.route.snapshot.paramMap.get('id');

    // Находим задачу
    let isFind = false;

    // В квестах
    if (isFind === false) {
      for (const qw of this.srv.pers.qwests) {
        for (const tsk of qw.tasks) {
          if (tsk.id === id) {
            this.tsk = tsk;
            isFind = true;

            break;
          }
        }
      }
    }

    // В навыках
    if (isFind === false) {
      for (const cha of this.srv.pers.characteristics) {
        for (const ab of cha.abilities) {
          for (const tsk of ab.tasks) {
            if (tsk.id === id) {
              this.tsk = tsk;
              this.tskAbility = ab;
              isFind = true;

              break;
            }
          }
        }
      }
    }

    if (this.tsk) {
      if (this.tsk.requrense === 'нет') {
        this.requrenses = Task.requrenses.filter(n => {
          return n === 'нет';
        });
      }
      else {
        this.requrenses = Task.requrenses.filter(n => {
          return n != 'нет';
        });
      }
    }

    const isEdit = this.route.snapshot.paramMap.get('isEdit');
    if (isEdit == 'true') {
      this.isEditMode = true;
    }

    if (!this.tsk.tskWeekDays) {
      this.tsk.tskWeekDays = [...Task.weekDays];
    }
  }

  onTskDateChange(ev) {
    this.tsk.date = ev;

    this.tsk.states.forEach(el => {
      el.isDone = false;
    });
  }

  /**
  * Сохранить данные.
  */
  saveData() {
    if (this.isEditMode) {
      if (Pers.GameSettings.isNoAbilities) {
        if (this.tskAbility) {
          this.tskAbility.name = this.tsk.name;
        }
      }
      this.srv.savePers(false);
      this.isEditMode = false;
    }
    else {
      this.isEditMode = true;
    }
  }

  setIsHard() {
    this.tsk.isHard = !this.tsk.isHard;
  }

  setSumStates() {
    this.tsk.isSumStates = !this.tsk.isSumStates;
  }

  /**
   * Сдвинуть задачу вверх.
   * @param i Индекс задачи.
   */
  up(i: number) {
    if (i >= 1) {
      let tmp = this.tsk.states[i];

      this.tsk.states[i] = this.tsk.states[i - 1];
      this.tsk.states[i - 1] = tmp;
    }
  }
}
