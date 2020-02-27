
jq191(function() {

    var zap_url="http://katalog.sznajder.pl";
    var tablica=[];
    
    jq191.getJSON(zap_url+"/findbycar_remote/getfordropdown?jsoncallback=?",function(data) {
            
                                  jq191.each(data, function(key, valu) {
                                          jq191("#category").append('<option value="'+valu.category+'">'+valu.category+'</option>');
                                          tablica[key]=valu.category;
                                  });
                                  
                          }
                  );
    
    
    function models_load(nr) {
      jq191("#category").val(tablica[nr]);
      jq191("#category").attr('disabled','disabled');
      jq191('#model').empty(); 
      jq191('#model').append('<option value="">model:</option>');  
      jq191.getJSON(zap_url+"/findbycar_remote/getmodel?category="+tablica[nr]+"&jsoncallback=?",function(data) {
           jq191.each(data, function(key, valu) {            
              jq191("#model").append('<option value="'+valu.model+'">'+valu.model+'</option>')
           });      
        }
      );
    }
    
    function show_hide(id) {
      if (jq191(".child-"+id).css("display")=="none") {
        jq191(".child-"+id).show();
      } else {
        jq191(".child-"+id).hide();}
    }
      
    
    jq191('#category').change(function() {
      var category=jq191(this).val(); 
      jq191('#model').empty(); 
      jq191('#model').append('<option value="">model:</option>');  
      jq191.getJSON(zap_url+"/findbycar_remote/getmodel?category="+category+"&jsoncallback=?",function(data) {
           jq191.each(data, function(key, valu) {            
              jq191("#model").append('<option value="'+valu.model+'">'+valu.model+'</option>')
           });      
        }
      );    
    }); 
    
    jq191('#model').change(function() {
      var category=jq191('#category').val();
      var model=jq191('#model').val();
      jq191('#series').empty();
      jq191('#series').append('<option value="">seria:</option>'); 
      jq191.getJSON(zap_url+"/findbycar_remote/getseries?model="+model+"&jsoncallback=?" , function(data) {
           jq191.each(data, function(key, valu) {                                       
              jq191("#series").append('<option value="'+valu.series+'">'+valu.series+'</option>')
           });      
        }
      );  
    }); 
    
  
    jq191('#series').change(function() {
      var category=jq191('#category').val();
      var model=jq191('#model').val();
      var series=jq191('#series').val();    
      var rezultaty='';    
      jq191.getJSON(zap_url+"/findbycar_remote/getengine?model="+model+"&series="+series+"&jsoncallback=?" , function(data) {
            var id=0;
           rezultaty += '<tr class="toptabela" style="color: #fff !important; background:#727272 !important;"><td style="color: #fff !important; background:#727272 !important;"  colspan="3"><span style="float: right; cursor: pointer; color: #fff !important; background:#727272 !important;" onClick="jq191(\'#rezultaty\').hide();">[x]</span></td></tr>';
           rezultaty+='<tr style="color: #fff !important; background:#727272 !important;" class="no_lines"><th style="color: #fff !important; background:#727272 !important;"  rowspan="2">Silnik/Model</th><th style="color: #fff !important; background:#727272 !important;">Rocznik</th><th style="color: #fff !important; background:#727272 !important;"></th></tr>';
           rezultaty+='<tr style="color: #fff !important; background:#727272 !important;" class="no_lines"><th style="color: #fff !important; background:#727272 !important;" >od</th><th style="color: #fff !important; background:#727272 !important;">do</th></tr>';
           jq191.each(data, function(key, valu) {                       
              rezultaty+="<tr onClick=\"if (jq191('.child-'+id).css('display')=='none') {jq191('.child-'+id).show(); } else { jq191('.child-'+id).hide();}\" id="+id+" class=\"pointer\"><td class=\"engine cell\">"+valu.engine+"</td><td class=\"from cell\">"+valu.build_from+"</td><td class=\"until cell\">"+valu.build_until+"</td></tr>";
              baterie=valu.batteries;
              jq191.each(baterie, function(k,v) {
                  rezultaty+='<tr class="child-'+id+'" style="display: none">';
                  rezultaty+='<td colspan="2"><div class="w200"><b>'+v.catalog_number+'</b><br>'+'<span class="capacity">- Pojemność: </span>'+v.capacity+' Ah<br><span class="currentt">- Prąd rozruchowy: </span>'+v.starting_current+' A<br><span class="voltage">- Napięcie: </span>'+v.voltage+' V</div>';
                  rezultaty+='<div class"w200"><br><span class="dim">- Wymiary: </span>'+v.length+'/'+v.width+'/'+v.height+'<br><span class="block">- Typ bloku: </span>'+v.block+'<br><span class="seroxat">- Seria: </span>'+v.series+'</div></td>';
                  rezultaty+='<td><a href="'+zap_url+'/productaplication/show/'+v.catalog_number+'" target="_blank" class="btn btn-mini btn-danger">»zobacz</a></td>';
                  rezultaty+='</tr>';
              });   
              id++;
              
           });
           jq191('#rezultaty').html(rezultaty).show();
           jq191('#rezultaty').draggable();
        }
      );
      
        
    })
    
    
    
     
        
     
  })