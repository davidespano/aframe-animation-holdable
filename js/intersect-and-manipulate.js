var self = null; //this (componente)
//true se si è verificato l'evento "intersezione"
var intersection = false;
var transformCreated = false; //flag creazione transform (evita che venga creato più di una volta)
var targetObject = null; //oggetto puntato
var oldPosition = null;
var oldOpacity = null;
var controls = ['translate', 'scale', 'rotate'];
var currentControl = 0;

var gestureHand = null;

//mano selezionata tramite componente
function selectedHand(hand, document) {
    let hands = document.querySelectorAll('[leap-hand]');
    if (hands) {
        for (let i = 0; i < hands.length; i++)
            if (hands[i].components['leap-hand'] && hands[i].components['leap-hand'].attrValue.hand === hand)
                return hands[i];
    }
}

//riconoscimento posa
function gestureRecognizer(hand) {
    //palmo verso l'alto, tre dita estese e due no (pollice, indice, mignolo estese)
    return (hand && hand.palmNormal[1] >= 0 && hand.pointables[0].extended && hand.pointables[1].extended && (!hand.pointables[2].extended) && (!hand.pointables[3].extended) && hand.pointables[4].extended);
}

//mano valida con l'array delle dita popolato
function validHand(hand) {
    return (hand && hand.pointables.length !== 0);
}

//creazione controllo in base ad array di valori
function createControl(transform, document, values) {
    let x, y, z, all;
    let xLine, yLine, zLine;
    //creazione freccia x
    x = document.querySelector('#x');
    if(x === null || x === undefined) {
        x = document.createElement(values.x.tag);
        x.setAttribute('id', values.x.id);
        transform.appendChild(x);
    }
    x.setAttribute('position', values.x.position);
    x.setAttribute('material', values.x.material);
    x.setAttribute('scale', values.x.scale);
    x.setAttribute('rotation', values.x.rotation);
    x.setAttribute('geometry', values.x.geometry);
    x.setAttribute('holdable', values.x.holdable);
    //creazione linea x
    xLine = document.querySelector('#xLine');
    if(xLine === null || xLine === undefined) {
        xLine = document.createElement(values.xLine.tag);
        xLine.setAttribute('id', values.xLine.id);
        transform.appendChild(xLine);
    }
    xLine.setAttribute('line', values.xLine.lineAttribute);
    //creazione freccia y
    y = document.querySelector('#y');
    if(y === null || y === undefined) {
        y = document.createElement(values.y.tag);
        y.setAttribute('id', values.y.id);
        transform.appendChild(y);
    }
    y.setAttribute('position', values.y.position);
    y.setAttribute('material', values.y.material);
    y.setAttribute('scale', values.y.scale);
    y.setAttribute('rotation', values.y.rotation);
    y.setAttribute('geometry', values.y.geometry);
    y.setAttribute('holdable', values.y.holdable);
    //creazione linea y
    yLine = document.querySelector('#yLine');
    if(yLine === null || yLine === undefined) {
        yLine = document.createElement(values.yLine.tag);
        yLine.setAttribute('id', values.yLine.id);
        transform.appendChild(yLine);
    }
    yLine.setAttribute('line', values.yLine.lineAttribute);
    //creazione freccia z
    z = document.querySelector('#z');
    if(z === null || z === undefined) {
        z = document.createElement(values.z.tag);
        z.setAttribute('id', values.z.id);
        transform.appendChild(z);
    }
    z.setAttribute('position', values.z.position);
    z.setAttribute('material', values.z.material);
    z.setAttribute('scale', values.z.scale);
    z.setAttribute('rotation', values.z.rotation);
    z.setAttribute('geometry', values.z.geometry);
    z.setAttribute('holdable', values.z.holdable);
    //creazione linea z
    zLine = document.querySelector('#zLine');
    if(zLine === null || zLine === undefined) {
        zLine = document.createElement(values.zLine.tag);
        zLine.setAttribute('id', values.zLine.id);
        transform.appendChild(zLine);
    }
    zLine.setAttribute('line', values.zLine.lineAttribute);
    //creazione controllo per tutti gli assi
    all = document.querySelector('#all');
    if(all === null || all === undefined) {
        all = document.createElement(values.all.tag);
        all.setAttribute('id', values.all.id);
        transform.appendChild(all);
    }
    all.setAttribute('position', values.all.position);
    all.setAttribute('material', values.all.material);
    all.setAttribute('scale', values.all.scale);
    all.setAttribute('geometry', values.all.geometry);
    all.setAttribute('holdable', values.all.holdable);
    //piani transform
    //TODO: piani transform
    /*if(currentControl === 0) {
        all.removeAttribute('geometry');
        all.removeAttribute('material');
        let planeXY = document.createElement('a-plane');
        planeXY.setAttribute('translatePlane');
        let planeYZ = document.createElement('a-plane');
        planeYZ.setAttribute('translatePlane');
        let planeZX = document.createElement('a-plane');
        planeZX.setAttribute('translatePlane');
        all.appendChild(planeXY);
        all.appendChild(planeYZ);
        all.appendChild(planeZX);
        //attributi
        planeXY.setAttribute('rotation', '0 -45 -90');
        planeXY.setAttribute('material', {
            side: 'double'
        });
        planeXY.setAttribute('width', 1);
        planeXY.setAttribute('height', 1);
        planeXY.setAttribute('position', '-0.364 0.5 0.364');
        planeXY.setAttribute('rotation', '0 45 90');
        planeXY.setAttribute('material', {
            side: 'double'
        });
        planeYZ.setAttribute('width', 1);
        planeYZ.setAttribute('height', 1);
        planeYZ.setAttribute('position', '0.364 0.5 -0.364');
        planeZX.setAttribute('rotation', '90 135 0');
        planeZX.setAttribute('material', {
            side: 'double'
        });
        planeZX.setAttribute('width', 1);
        planeZX.setAttribute('height', 1);
        planeZX.setAttribute('position', '0 0 0');
    } else {
        let array = document.querySelectorAll('[translatePlane]');
        for(let i = 0; i < array.length; i++) {
            array[i].setAttribute('visible', false);
        }
    }*/
}

//creazione transform (popolamento valori da usare per creare il controllo)
function createTransform(transformType, document) {
    let values = null;
    let transform = document.querySelector('#transform');
    if(transform === null || transform === undefined) {
        transform = document.createElement('a-entity');
        transform.setAttribute('id', 'transform');
        document.querySelector('a-scene').appendChild(transform);
    }
    transform.setAttribute('position', targetObject.getAttribute('position'));
    transform.setAttribute('rotation', document.querySelector('[camera]').getAttribute('rotation'));
    if (transformType === 'translate') {
        currentControl = 0;
        values = {
            x: {
                tag: 'a-entity',
                id: 'x',
                position: '0.2 0 0.2',
                material: 'color: #ff0000',
                scale: '0.1 0.1 0.1',
                rotation: '0 -45 -90',
                geometry: 'primitive: cone; radiusBottom: 0.25',
                holdable: ''
            },
            xLine: {
                tag: 'a-entity',
                id: 'xLine',
                lineAttribute: 'start: 0.2, 0, 0.2; end: 0 0 0; color: #ff0000'
            },
            y: {
                tag: 'a-entity',
                id: 'y',
                position: '0 0.2 0',
                material: 'color: #00ff00',
                scale: '0.1 0.1 0.1',
                rotation: '0 0 0',
                geometry: 'primitive: cone; radiusBottom: 0.25',
                holdable: ''
            },
            yLine: {
                tag: 'a-entity',
                id: 'yLine',
                lineAttribute: 'start: 0, 0.2, 0; end: 0 0 0; color: #00ff00'
            },
            z: {
                tag: 'a-entity',
                id: 'z',
                position: '-0.2 0 0.2',
                material: 'color: #0000ff',
                scale: '0.1 0.1 0.1',
                rotation: '0 45 90',
                geometry: 'primitive: cone; radiusBottom: 0.25',
                holdable: ''
            },
            zLine: {
                tag: 'a-entity',
                id: 'zLine',
                lineAttribute: 'start: -0.2, 0, 0.2; end: 0 0 0; color: #0000ff'
            },
            all: {
                tag: 'a-entity',
                id: 'all',
                position: '0 0 0',
                material: 'color: #ffffff',
                scale: '0.03 0.03 0.03',
                geometry: 'primitive: sphere',
                holdable: ''
            }
        }
    } else if (transformType === 'scale') {
        currentControl = 1;
        values = {
            x: {
                tag: 'a-entity',
                id: 'x',
                position: '0.2 0 0.2',
                material: 'color: #ff0000',
                scale: '0.06 0.06 0.06',
                rotation: '0 45 0',
                geometry: 'primitive: box',
                holdable: ''
            },
            xLine: {
                tag: 'a-entity',
                id: 'xLine',
                lineAttribute: 'start: 0.2, 0, 0.2; end: 0 0 0; color: #ff0000'
            },
            y: {
                tag: 'a-entity',
                id: 'y',
                position: '0 0.2 0',
                material: 'color: #00ff00',
                scale: '0.06 0.06 0.06',
                rotation: '0 45 0',
                geometry: 'primitive: box',
                holdable: ''
            },
            yLine: {
                tag: 'a-entity',
                id: 'yLine',
                lineAttribute: 'start: 0, 0.2, 0; end: 0 0 0; color: #00ff00'
            },
            z: {
                tag: 'a-entity',
                id: 'z',
                position: '-0.2 0 0.2',
                material: 'color: #0000ff',
                scale: '0.06 0.06 0.06',
                rotation: '0 45 0',
                geometry: 'primitive: box',
                holdable: ''
            },
            zLine: {
                tag: 'a-entity',
                id: 'zLine',
                lineAttribute: 'start: -0.2, 0, 0.2; end: 0 0 0; color: #0000ff'
            },
            all: {
                tag: 'a-entity',
                id: 'all',
                position: '0 0 0',
                material: 'color: #ffffff',
                scale: '0.05 0.05 0.05',
                geometry: 'primitive: box',
                holdable: ''
            }
        }
    } else if (transformType === 'rotate') {
        currentControl = 2;
        values = {
            x: {
                tag: '',
                id: 'x',
                position: '0 0 0',
                material: 'color: #ff0000',
                scale: '0.05 0.05 0.05',
                rotation: '0 90 0',
                geometry: 'primitive: torus; radius: 5; radiusTubular: 0.1; segmentsRadial: 100; segmentsTubular: 100',
                holdable: ''
            },
            xLine: {
                tag: 'a-entity',
                id: 'xLine',
                lineAttribute: 'visible: false'
            },
            y: {
                tag: 'a-entity',
                id: 'y',
                position: '0 0 0',
                material: 'color: #00ff00',
                scale: '0.05 0.05 0.05',
                rotation: '90 0 0',
                geometry: 'primitive: torus; radius: 5; radiusTubular: 0.1; segmentsRadial: 100; segmentsTubular: 100',
                holdable: ''
            },
            yLine: {
                tag: 'a-entity',
                id: 'yLine',
                lineAttribute: 'visible: false'
            },
            z: {
                tag: 'a-entity',
                id: 'z',
                position: '0 0 0',
                material: 'color: #0000ff',
                scale: '0.05 0.05 0.05',
                rotation: '0 0 0',
                geometry: 'primitive: torus; radius: 5; radiusTubular: 0.1; segmentsRadial: 100; segmentsTubular: 100',
                holdable: ''
            },
            zLine: {
                tag: 'a-entity',
                id: 'zLine',
                lineAttribute: 'visible: false'
            },
            all: {
                tag: 'a-entity',
                id: 'all',
                position: '0 0 0',
                material: 'color: #ffffff',
                scale: '0.05 0.05 0.05',
                geometry: 'primitive: torus; radius: 6; radiusTubular: 0.1; segmentsRadial: 100; segmentsTubular: 100',
                holdable: ''
            }
        }
    }
    createControl(transform, document, values);
}

function switchTransformGesture (hand) {
    //TODO: gesture per switch
    //TODO: possibilità di nascondere il transform dalla scena (document.querySelector('#transform').setAttribute('visible', false);
    return false;
}

function createPath (document) {
    //definizione del percorso. il percorso viene creato con un componente esterno per a-frame
    //#1 curva
    let curve = document.querySelector('#curve');
    if(curve === null || curve === undefined) {
        curve = document.createElement('a-curve');
        curve.setAttribute('id', 'curve');
        document.querySelector('a-scene').appendChild(curve);
        //#2 punti (figli)
        let child0 = document.createElement('a-curve-point');
        child0.setAttribute('id', 'point0');
        child0.setAttribute('position', '0 0 0');
        curve.appendChild(child0);
        let child2 = document.createElement('a-curve-point');
        child2.setAttribute('id', 'point2');
        //child2: "origine"
        child2.setAttribute('position', '0 0 0');
        curve.appendChild(child2);
    }
}

AFRAME.registerComponent('intersect-and-manipulate', {
    //raycaster (dipendenza dal componente a-frame)
    dependencies: ['raycaster'],
    schema: {
        //mano da utilizzare per il raggio
        hand: {type: 'string', default: 'right', oneOf: ['left', 'right']},
        //controllo da gestire per l'oggetto selezionato
        control: {type: 'string', default: 'scale', oneOf: ['translate', 'scale', 'rotate']},
        tag: {type: 'string', default: 'selectable'}
    },

    init: function () {
        self = this;
        this.el.setAttribute('raycaster', {
            showLine: false,
            //evitare collisioni con la camera o con il raggio stesso
            near: 0.05,
            //lunghezza del raggio
            far: 0.05
        });
        //event listener: il raggio ha intersecato qualcosa
        //nel momento in cui un oggetto viene intersecato dal raggio, viene creato un percorso che parte dalla posizione
        //dell'oggetto e arriva alla posizione della camera (posizione dell'utente) e l'oggetto intersecato segue questo
        //percorso
        this.el.addEventListener('raycaster-intersection', this.raycasterIntersection.bind(this));
        this.el.addEventListener('raycaster-intersection-cleared', function () {
            intersection = false;
        });
    },

    tick: function () {
        let cameraPosition = document.querySelector('[camera]').getAttribute('position');
        let aframeHand = selectedHand(this.data.hand, document);
        let hand = null;
        if (aframeHand)
            hand = aframeHand.components['leap-hand'].getHand();
        //informazioni LeapMotion SDK
        if (validHand(hand)) {
            //posizione del palmo e riconoscimento gesto
            if (gestureRecognizer(hand)) {
                //temporaneo
                gestureHand = aframeHand;
                //hand raycaster
                let origin = aframeHand.components['leap-hand'].intersector.raycaster.ray.origin;
                let relativeOriginPosition = origin.clone();
                //document.querySelector('[camera]').components['camera'].el.object3D.updateMatrixWorld();
                document.querySelector('[camera]').components['camera'].el.object3D.worldToLocal(relativeOriginPosition);
                //modifica del raycaster del componente con posizione della mano (coincide con la mesh)
                this.el.setAttribute('raycaster', {
                    showLine: false,
                    origin: relativeOriginPosition,
                    far: 5
                });
                //percorso meshline relativo
                let path = relativeOriginPosition.x + ' ' + relativeOriginPosition.y + ' ' + relativeOriginPosition.z + ', ' + relativeOriginPosition.x + ' ' + relativeOriginPosition.y + ' ' + (relativeOriginPosition.z - 5);
                if (intersection) {
                    this.el.setAttribute('meshline', {
                        lineWidth: 20,
                        path: path,
                        color: '#74BEC1',
                        lineWidthStyler: '1 - p'
                    });
                } else {
                    this.el.setAttribute('meshline', {
                        lineWidth: 20,
                        path: path,
                        color: '#FFFFFF',
                        lineWidthStyler: '1 - p'
                    });
                }
            } else {
                this.el.removeAttribute('meshline');
                this.el.setAttribute('raycaster', {
                    showLine: false,
                    origin: 0.05,
                    far: 0.05
                });
            }
        }
        let transform = document.querySelector('#transform');
        if (transform !== null) {
            //scala il transform in base alla distanza
            let transformPosition = document.querySelector('#transform').getAttribute('position');
            //let distance = Math.sqrt(Math.pow(transformPosition.x - cameraPosition.x, 2) + Math.pow(transformPosition.y - cameraPosition.y, 2) + Math.pow(transformPosition.z - cameraPosition.z, 2));
            let distance = new THREE.Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z).distanceTo(new THREE.Vector3(transformPosition.x, transformPosition.y, transformPosition.z));
            transform.setAttribute('scale', (distance) + ' ' + (distance) + ' ' + (distance));

            if(switchTransformGesture(gestureHand.components['leap-hand'].getHand())) {
                //cambia il transform... in base a cosa si sceglie come cambiare?
                //si potrebbe anche usare uno swipe e considerare i controlli come un array circolare
                createTransform(controls[(currentControl + 1) % controls.length], document);
            }
        }
    },

    raycasterIntersection: function (event) {
        //oggetto intersecato
        let intersectedObject = event.detail.els[0];
        //mano visibile
        let isVisible = selectedHand(event.srcElement.components['intersect-and-manipulate'].data.hand, document).components['leap-hand'].isVisible;
        if (isVisible) {
            //posizioni elemento intersecato e camera per successiva definizione del percorso
            let endPath = intersectedObject.getAttribute('position');
            //document.querySelector('[camera]').components['camera'].el.object3D.updateMatrixWorld();
            let localPosition = new THREE.Vector3(0, -0.5, -3);
            let startPath = document.querySelector('[camera]').components['camera'].el.object3D.localToWorld(localPosition);
            if (intersectedObject.getAttribute(this.data.tag) !== null) {
                //inizia il percorso del nuovo oggetto
                intersection = true;
                createPath(document);
                document.querySelector('#point0').setAttribute('position', endPath);
                document.querySelector('#point2').setAttribute('position', startPath);
                intersectedObject.setAttribute('alongpath', {
                    curve: '#curve',
                    delay: 1500
                });
                intersectedObject.addEventListener('movingstarted', function (event) {
                    transformCreated = false;
                });
                intersectedObject.addEventListener('movingended', function (event) {
                    if (!transformCreated) {
                        //propagazione evento
                        event.srcElement.setAttribute('alongpath', {
                            triggerRadius: 0
                        });
                        event.srcElement.removeAttribute('alongpath');
                        if(targetObject !== null && targetObject !== undefined) {
                            targetObject.setAttribute('material', 'opacity: ' + oldOpacity);
                            //se l'elemento non è stato traslato
                            if(oldPosition !== null)
                                targetObject.setAttribute('position', oldPosition);
                        }
                        //aggiornamento vecchia posizione
                        oldPosition = endPath;
                        targetObject = event.srcElement;
                        oldOpacity = targetObject.getAttribute('material').opacity;
                        //creazione transform
                        control = self.data.control;
                        createTransform(control, document);
                        transformCreated = true;
                        event.srcElement.setAttribute('material', 'opacity: 0.5');
                    }
                });
            } else
                intersection = false;
        }
    }
});
