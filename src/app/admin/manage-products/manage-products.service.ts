import { Injectable, Injector } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import {NotificationService} from '../../core/notification.service';

@Injectable()
export class ManageProductsService extends ApiService {
  constructor(injector: Injector, private readonly notificationService: NotificationService) {
    super(injector);
  }

  uploadProductsCSV(file: File): Observable<unknown> {
    if (!this.endpointEnabled('import')) {
      console.warn(
        'Endpoint "import" is disabled. To enable change your environment.ts config'
      );
      return EMPTY;
    }

    return this.getPreSignedUrl(file.name).pipe(
      switchMap((url) => this.http.put(url, file, {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Type': 'text/csv',
          },
      })),
      catchError((err) => {
        console.log('My error: ', err);

        if (err.status === 403) {
          this.notificationService.showError('403 Forbidden !');
        }

        if (err.status === 401) {
          this.notificationService.showError('401 Unauthorized !');
        }

        return of(err);
      })
    );
  }

  private getPreSignedUrl(fileName: string): Observable<string> {
    const url = this.getUrl('import', 'import');

    const authorizationToken = localStorage.getItem('authorization_token');

    return this.http.get<string>(url, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Basic ${authorizationToken}` || '', //
      },
      params: {
        name: fileName,
        token: authorizationToken || ''
      },
    });
  }
}
