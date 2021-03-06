﻿module BABYLON.Debug {

    export class PhysicsViewer {
        
        protected _impostors:Array<PhysicsImpostor> = [];
        protected _meshes:Array<AbstractMesh> = [];
        protected _scene:Scene;
        protected _numMeshes = 0;
        protected _physicsEnginePlugin:IPhysicsEnginePlugin;
        private _renderFunction: () => void;

        private _debugBoxMesh:Mesh;
        private _debugSphereMesh:Mesh;
        private _debugMaterial:StandardMaterial;

        constructor(scene:Scene){

            this._scene = scene || Engine.LastCreatedScene;
            this._physicsEnginePlugin = this._scene.getPhysicsEngine().getPhysicsPlugin();

        }

        protected _updateDebugMeshes():void{

            var plugin = this._physicsEnginePlugin;

            for (var i = 0; i < this._numMeshes; i++){
                if(this._impostors[i].isDisposed){
                    this.hideImpostor(this._impostors[i--]);
                }else{
                    plugin.syncMeshWithImpostor(this._meshes[i], this._impostors[i]);
                }
            }

        }

        public showImpostor(impostor:PhysicsImpostor):void{

            for (var i = 0; i < this._numMeshes; i++){
                if(this._impostors[i] == impostor){
                    return;
                }
            }

            var debugMesh = this._getDebugMesh(impostor, this._scene);

            if(debugMesh){
                this._impostors[this._numMeshes] = impostor;
                this._meshes[this._numMeshes] = debugMesh;

                if(this._numMeshes === 0){
                    this._renderFunction = this._updateDebugMeshes.bind(this);
                    this._scene.registerBeforeRender(this._renderFunction);
                }

                this._numMeshes++;
            }

        }

        public hideImpostor(impostor:PhysicsImpostor){

            var removed = false;

            for (var i = 0; i < this._numMeshes; i++){
                if(this._impostors[i] == impostor){
                    this._scene.removeMesh(this._meshes[i]);
                    this._meshes[i].dispose();
                    this._numMeshes--;
                    if(this._numMeshes > 0){
                        this._meshes[i] = this._meshes[this._numMeshes];
                        this._impostors[i] = this._impostors[this._numMeshes];
                        this._meshes[this._numMeshes] = null;
                        this._impostors[this._numMeshes] = null;
                    }else{
                        this._meshes[0] = null;
                        this._impostors[0] = null;
                    }
                    removed = true;
                    break;
                }
            }

            if(removed && this._numMeshes === 0){
                this._scene.unregisterBeforeRender(this._renderFunction);
            }

        }

        private _getDebugMaterial(scene:Scene):Material{
            if(!this._debugMaterial){
                this._debugMaterial = new StandardMaterial('', scene);
                this._debugMaterial.wireframe = true;
            }
            
            return this._debugMaterial;
        }

        private _getDebugBoxMesh(scene:Scene):AbstractMesh{
            if(!this._debugBoxMesh){
                this._debugBoxMesh = MeshBuilder.CreateBox('physicsBodyBoxViewMesh', { size: 1 }, scene); 
                this._debugBoxMesh.renderingGroupId = 1;
                this._debugBoxMesh.rotationQuaternion = Quaternion.Identity();
                this._debugBoxMesh.material = this._getDebugMaterial(scene);
                scene.removeMesh(this._debugBoxMesh);             
            }

            return this._debugBoxMesh.createInstance('physicsBodyBoxViewInstance');
        }

        private _getDebugSphereMesh(scene:Scene):AbstractMesh{
            if(!this._debugSphereMesh){
                this._debugSphereMesh = MeshBuilder.CreateSphere('physicsBodySphereViewMesh', { diameter: 1 }, scene); 
                this._debugSphereMesh.renderingGroupId = 1;
                this._debugSphereMesh.rotationQuaternion = Quaternion.Identity();
                this._debugSphereMesh.material = this._getDebugMaterial(scene);
                scene.removeMesh(this._debugSphereMesh);
            }

            return this._debugSphereMesh.createInstance('physicsBodyBoxViewInstance');
        }

        private _getDebugMesh(impostor:PhysicsImpostor, scene:Scene):AbstractMesh{
            var body = impostor.physicsBody;
            var shape = body.shapes[0];
            var mesh:AbstractMesh;
            
            if (impostor.type == PhysicsImpostor.BoxImpostor) {
                mesh = this._getDebugBoxMesh(scene);
                impostor.getBoxSizeToRef(mesh.scaling);
            } else if(impostor.type == PhysicsImpostor.SphereImpostor){	
                mesh = this._getDebugSphereMesh(scene);  
                var radius = impostor.getRadius();          
                mesh.scaling.x = radius * 2;
                mesh.scaling.y = radius * 2;
                mesh.scaling.z = radius * 2;	
            }

            return mesh;
        }

        public dispose(){
            
            for (var i = 0; i < this._numMeshes; i++){
                this.hideImpostor(this._impostors[i]);
            }

            if(this._debugBoxMesh){
                this._debugBoxMesh.dispose();
            }
            if(this._debugSphereMesh){
                this._debugSphereMesh.dispose();
            }
            if(this._debugMaterial){
                this._debugMaterial.dispose();
            }

            this._impostors.length = 0;
            this._scene = null;
            this._physicsEnginePlugin = null;
            
        }

    }
}
