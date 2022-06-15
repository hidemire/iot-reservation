import { createMachine } from 'xstate';

export const ionSfuMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QEsD2A7AtLAZgV0wFsBDAYwAtl0wA6AZQEkBxAOQEEAZAfQGEB5FiwCiPACoMWTAMQQMtKgDdUAa3kZs+ImUrV6zdt36CR4yQkWpSxAC5p0AbQAMAXUSgADqljJbGNyAAPRAAmAE4AVhoADgAWAGYAdjjwgDYUxMdggEYAGhAAT0QsiJoYxxjirJTQxxSohPC4gF8mvLsNAhIKKlpGVk5eAWExCWkwACdx1HGadwAbGxxpwhp23E7tHr1+wyGTUfN0JStfBxd-T29T-yCEMMjYxOS0jOy8woQsuKiaUMTG75lLIJFLAlptdTrLTdXR9AyDYxiIQAERkclWRxUaiwUK6Ol6+gGRmGohRh2ONjsTlcSBAlx8dhuiHCwXeiFBcVKNQSVUyWRi8VC4JAa00eK2PA4DCELFEvAASkI2KTkTR5Xw+ABZLgcJUANRRUgAUnwJFx1VqLl4GX5abcUiyaOEssFwqlyllnRE2QgUq6aPzvsEoilHKFQjzhaKNjDaJLpbKFUqVWqNdrdWwDajkQw6MSTFaroy7YgYqkaA1HJky3Fw6koj6EjEUgGKkk4nFqo4oo5mq0RZCxZtdPGZXKeIrlSjU1quCaJIaMwbzWnCzb0EzfY7na73RUveEfeEEgkaMEq+VQwl6lHBzH8TRR4mJ8nDTm83sxGvriW7glHL89QsiyxSZMGCQ+qGAHho4PKhtkAqJLeOJDrG2zwuImpCHwACqohSAEsDWDYtDEDg1gTAAFOeVYAJRSNG0IPnCAyYdheHfsWoC3Pc0TxEkqTpP+bwFIgNS-H8DRfN2NThGGLT9ugqAQHA-iMeKsKErsiKmEwnG2txpasqJnzlNEwZZFEx6xNe1QJMhHRMVsLHaSSKL6Ruv4xFZFZ1Ek3bOuEUSeoeJlVJyCShN5wTJMEwRlMe4QObiw5xlKY5JlOqoWum+rubS9I-oZCAxHFFapPcbpyQkCFHtUNDfNJILBEkIJRMlqEPk+46TimOVzqawjIh5m49jEZ5+m6wl+nydWchEWSwckIausGHX3hK6XPr1+UeNaRWBCEzaAQ0q2gXF9Q+jE16-MecR8ikApuvy61OZpOxcO++ZIsNBX7Vxh0IA043np610siCjguo2-I0L28WOOEpUOlEnavRpBIfWxuGiCNXlRMEvn1LBUQE6E4U+lF0RQ4j2RVqGPYpOjqV48Vlk+pZClNEAA */
  createMachine({
    id: 'ion-sfu-machine',
    initial: 'SIGNAL_CONNECTING',
    states: {
      SIGNAL_CONNECTING: {
        invoke: {
          src: 'createSignal',
          onDone: [
            {
              target: 'SIGNAL_CONNECTED',
            },
          ],
          onError: [
            {
              target: 'SIGNAL_TIMEOUT',
            },
          ],
        },
      },
      SIGNAL_CONNECTED: {
        invoke: {
          src: 'createClient',
          onDone: [
            {
              target: 'CLIENT_CREATED',
            },
          ],
        },
      },
      CLIENT_CREATED: {
        initial: 'ROOM_LEAVED',
        states: {
          ROOM_LEAVED: {
            invoke: {
              src: 'leaveRoom',
            },
            on: {
              JOIN_ROOM: {
                target: 'ROOM_JOINED',
              },
              DISCONNECT: {
                target: '#ion-sfu-machine.SIGNAL_DISCONNECTED',
              },
            },
          },
          ROOM_JOINED: {
            invoke: {
              src: 'joinRoom',
            },
            on: {
              LEAVE_ROOM: {
                target: 'ROOM_LEAVED',
              },
            },
          },
        },
        on: {
          DISCONNECT: {
            target: '.ROOM_LEAVED',
          },
        },
      },
      SIGNAL_DISCONNECTED: {
        invoke: {
          src: 'disconnectSignal',
        },
        type: 'final',
      },
      SIGNAL_TIMEOUT: {
        after: {
          '2000': {
            target: 'SIGNAL_CONNECTING',
          },
        },
      },
    },
  });
