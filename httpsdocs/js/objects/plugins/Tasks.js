Ext.namespace('CB.objects.plugins');

Ext.define('CB.objects.plugins.Tasks', {
    extend: 'CB.objects.plugins.Base'
    ,alias: 'CBObjectsPluginsTasks'

    ,initComponent: function(){

        this.actions = {
           add: new Ext.Action({
                // ,text: L.Add
                iconCls: 'i-plus'
                ,scope: this
                ,handler: this.onAddClick
                ,data: {
                    template_id: App.config.default_task_template
                }
            })
        };

        var tpl = new Ext.XTemplate(
            '<table class="block-plugin">'
            ,'<tpl for=".">'
            ,'<tr>'
            ,'    <td class="obj">'
            ,'        <img class="i32" src="/' + App.config.coreName + '/photo/{cid}.jpg?32={[ CB.DB.usersStore.getPhotoParam(values.cid) ]}" title="{user}">'
            ,'    </td>'
            ,'    <td>'
            ,'        <span class="click">{name}</span><br />'
            ,'        <span class="gr" title="{[ displayDateTime(values.cdate) ]}">{ago_text}</span>'
            ,'    </td>'
            ,'    <td class="elips">'
            ,'        <span class="click menu"></span>'
            ,'    </td>'
            ,'</tr>'
            ,'</tpl>'
            ,'</table>'
        );

        this.store = new Ext.data.JsonStore({
            autoDestroy: true
            ,model: 'ContentItem'
            ,proxy: new  Ext.data.MemoryProxy()
        });

        this.dataView = new Ext.DataView({
            tpl: tpl
            ,store: this.store
            ,autoHeight: true
            ,itemSelector:'tr'
            ,listeners: {
                scope: this
                ,itemclick: this.onItemClick
            }
        });

        Ext.apply(this, {
            title: L.Tasks
            ,items: this.dataView
        });

        CB.objects.plugins.Tasks.superclass.initComponent.apply(this, arguments);

        this.enableBubble(['createobject']);
    }

    ,onLoadData: function(r, e) {
        if(Ext.isEmpty(r.data)) {
            return;
        }
        this.store.loadData(r.data);
    }

    ,onItemClick: function (cmp, record, item, index, e, eOpts) {//dv, index, el, e
        var te = Ext.get(e.getTarget());
        if(!te) {
            return;
        }

        if(te.hasCls('menu')) {
            this.showActionsMenu(e.getXY());
        } else if(te.hasCls('click')) {
            this.openObjectProperties(this.store.getAt(index).data);
        }

    }

    ,showActionsMenu: function(coord){
        if(Ext.isEmpty(this.puMenu)) {
            this.puMenu = new Ext.menu.Menu({
                items: [
                    {
                        text: 'Close'
                    },{
                        text: 'Delete'
                        ,iconCls: 'i-trash'
                    },'-',{
                        text: 'In new tab'
                        ,iconCls: 'icon-external'
                    }
                ]
            });
        }

        this.puMenu.showAt(coord);
    }

    ,getToolbarItems: function() {
        return [this.actions.add];
    }

    ,getContainerToolbarItems: function() {
        rez = {
            tbar: {}
            ,menu: {}
        };

        if(this.params) {
            rez['menu']['addtask'] = {};

            if(CB.DB.templates.getType(this.params.template_id) !== 'file') {
                rez['menu']['new'] = {};
            }
        }


        return rez;
    }

    ,onAddClick: function(b, e) {
        this.fireEvent('createobject', b.config.data, e);
    }
});
