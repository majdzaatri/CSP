const firstName=document.getElementById('firstname')
const lastName=document.getElementById('lastname')
const email=document.getElementById('email')
const password=document.getElementById('password')
const confirmPass=document.getElementById('confirmPass')
const promocode=document.getElementById('promocode')
const submit=document.getElementById('submitBtn')


submit.addEventListener('click' , (e) => {
  
   
    if(lastName.value==='' || lastName.value===null)
    {
        e.preventDefault()
        document.getElementById('errorLastname').innerText=" Last name cannot be blank"
    }
    if(firstName.value==='' || firstName.value===null)
    {
        e.preventDefault()
        document.getElementById('errorFirstname').innerText=" First name cannot be blank"
    }
  
    let regx=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(!regx.test(email.value))
        {
            e.preventDefault()
            document.getElementById('errorEmail').innerText=" Email must be in xxx@yyy.zzz format"
        }
        
        let passwordregx= /^(?=.*\d)(?=.*[a-zA-Z]).{6,25}$/;
        if(password.value==='' || password.value===null)
        {
            e.preventDefault()
            document.getElementById('errorPassword').innerText=" Password is blank"
        }
       else if(!passwordregx.test(password.value))
        {
            e.preventDefault()
            document.getElementById('errorPassword').innerText=" Password's length must be at least 6 and must include at least 1 digit"
        }
        if(confirmPass.value==='' || confirmPass.value===null)
        {
            e.preventDefault()
            document.getElementById('errorPasswordConformation').innerText=" Confirm Password is blank"
        }
       else if(confirmPass.value!==password.value)
        {
            e.preventDefault()
            document.getElementById('errorPasswordConformation').innerText=" Please make sure it matches your password"
        }
        
        
})
function setErrorFor(input,message)
{
    const formControl=input.parentElement;
    const small=formControl.querySelector('small');
    small.innerText=message;
    formControl.className='form-control'
}