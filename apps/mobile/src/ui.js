import { StyleSheet } from 'react-native';

export const C = { blue:'#1A73E8', orange:'#FF6D00', mint:'#00C49A', gold:'#FFB300', red:'#E53935', bg:'#F8F9FA', ink:'#181C20', muted:'#667085', white:'#FFFFFF', line:'#E5E8EE' };
export const S = StyleSheet.create({
  screen:{flex:1,backgroundColor:C.bg}, content:{padding:16,paddingBottom:40}, title:{fontSize:28,fontWeight:'800',color:C.ink}, subtitle:{fontSize:14,color:C.muted,marginTop:6,lineHeight:21},
  card:{backgroundColor:C.white,borderRadius:20,padding:16,marginBottom:12,shadowColor:'#000',shadowOpacity:.05,shadowRadius:12,shadowOffset:{width:0,height:4},elevation:2},
  row:{flexDirection:'row',alignItems:'center'}, between:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, h2:{fontSize:18,fontWeight:'700',color:C.ink}, label:{fontSize:13,fontWeight:'700',color:C.muted,marginBottom:7,marginTop:12},
  input:{borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.white,paddingHorizontal:14,paddingVertical:13,fontSize:15,color:C.ink},
  button:{backgroundColor:C.blue,borderRadius:15,padding:15,alignItems:'center',marginTop:18}, orangeButton:{backgroundColor:C.orange}, buttonText:{color:C.white,fontWeight:'800',fontSize:15},
  pill:{alignSelf:'flex-start',borderRadius:999,paddingHorizontal:10,paddingVertical:5,backgroundColor:'#E8F1FE',color:C.blue,fontSize:11,fontWeight:'800'}, error:{backgroundColor:'#FFEBEB',color:C.red,padding:12,borderRadius:12,marginVertical:12},
  amount:{fontSize:20,fontWeight:'800',color:C.blue}, separator:{height:1,backgroundColor:C.line,marginVertical:12}
});
